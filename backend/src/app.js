import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import fs from 'fs'
import { createRequire } from 'module'
import admin from 'firebase-admin'
import corsMiddleware from './middleware/cors.js'
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import db, { initDatabase, saveKnowledge, getKnowledgeList, deleteKnowledge as dbDeleteKnowledge, clearKnowledge as dbClearKnowledge } from './services/database.js'
import { checkOllamaHealth } from './services/ollama.js'
import { checkWhisperHealth } from './services/whisper.js'
import { extractPdfText, chunkText } from './services/pdfService.js'
import auth from './middleware/auth.js'
import multer from 'multer'

dotenv.config()
const serviceAccount = JSON.parse(fs.readFileSync(new URL('../firebase-adminsdk.json', import.meta.url)))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const app = express()
app.use(helmet(), corsMiddleware, express.json({ limit: '200mb' }), express.urlencoded({ extended: true, limit: '200mb' }))
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))
app.use('/api/chat', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }))
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.get('/api/knowledge/:id/content', auth, (req, res) => {
  try {
    const row = db.prepare('SELECT id, filename, content FROM knowledge_base WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id)
    if (!row) return res.status(404).json({ error: 'Nao encontrado' })
    res.json(row)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/knowledge/:id', auth, (req, res) => {
  try {
    const { content, title } = req.body
    if (!content) return res.status(400).json({ error: 'Conteudo obrigatorio' })
    const chunks = content.match(/.{1,4000}/gs) || [content]
    db.prepare('UPDATE knowledge_base SET content = ?, chunks = ?, filename = ? WHERE id = ? AND user_id = ?')
      .run(content, JSON.stringify(chunks), title || 'texto', req.params.id, req.user.id)
    res.json({ message: 'Atualizado' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/knowledge', auth, (req, res) => {
  try { res.json(getKnowledgeList(req.user.id)) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/knowledge/text', auth, (req, res) => {
  try {
    const { title, text } = req.body
    if (!title || !text) return res.status(400).json({ error: 'Titulo e texto obrigatorios' })
    const chunks = text.match(/.{1,4000}/gs) || [text]
    saveKnowledge(req.user.id, title, 'txt', text, chunks)
    res.json({ message: 'Sucesso' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/knowledge/clear', auth, (req, res) => {
  try { dbClearKnowledge(req.user.id); res.json({ success: true }) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/knowledge/:id', auth, (req, res) => {
  try { dbDeleteKnowledge(req.user.id, req.params.id); res.json({ success: true }) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/upload/pdf', auth, multer({ storage: multer.memoryStorage() }).single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' })
    const fullText = req.file.originalname.endsWith('.pdf') ? await extractPdfText(req.file.buffer.toString('base64')) : req.file.buffer.toString('utf8')
    const chunks = chunkText(fullText, 4000)
    saveKnowledge(req.user.id, Buffer.from(req.file.originalname, 'latin1').toString('utf8'), req.file.originalname.endsWith('.pdf') ? 'pdf' : 'txt', fullText, chunks)
    res.json({ message: 'Sucesso' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post("/api/extract-pdf", auth, multer({ storage: multer.memoryStorage() }).single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo nao enviado" })
    const text = await extractPdfText(req.file.buffer.toString("base64"))
    res.json({ text: text.substring(0, 8000) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export const startServer = async () => { initDatabase(); app.listen(process.env.PORT || 3001); }