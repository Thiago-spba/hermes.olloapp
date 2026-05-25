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
app.use(helmet(), corsMiddleware, express.json({ limit: '50mb' }), express.urlencoded({ extended: true, limit: '50mb' }))
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))
app.use('/api/chat', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }))
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.get('/api/knowledge', (req, res) => {
  try { res.json(getKnowledgeList('default_user')); }
  catch (err) { res.status(500).json({ error: err.message }); }
})

app.post('/api/knowledge/text', (req, res) => {
  try {
    const { title, text } = req.body
    if (!title || !text) return res.status(400).json({ error: 'Titulo e texto obrigatorios' })
    const chunks = text.match(/.{1,4000}/gs) || [text]
    saveKnowledge('default_user', title, 'txt', text, chunks)
    res.json({ message: 'Sucesso' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})
app.delete('/api/knowledge/clear', (req, res) => {
  try { dbClearKnowledge('default_user'); res.json({ success: true }) }
  catch (err) { res.status(500).json({ error: err.message }) }
})
app.delete('/api/knowledge/:id', (req, res) => {
  try { dbDeleteKnowledge('default_user', req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ error: err.message }); }
})

app.post('/api/upload/pdf', multer({ storage: multer.memoryStorage() }).single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo nao enviado' })
    const fullText = req.file.originalname.endsWith('.pdf') ? await extractPdfText(req.file.buffer.toString('base64')) : req.file.buffer.toString('utf8');
    const chunks = chunkText(fullText, 4000);
    saveKnowledge('default_user', req.file.originalname, req.file.originalname.endsWith('.pdf') ? 'pdf' : 'txt', fullText, chunks);
    res.json({ message: 'Sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
})

export const startServer = async () => { initDatabase(); app.listen(process.env.PORT || 3001); }
