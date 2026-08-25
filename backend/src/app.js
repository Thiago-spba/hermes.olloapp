import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import fs from 'fs'
import admin from 'firebase-admin'
import corsMiddleware from './middleware/cors.js'
import authRoutes from './routes/auth.js'
import verifySupremoRoutes from './routes/verifySupremo.js'
import chatRoutes from './routes/chat.js'
import db, { initDatabase, saveKnowledge, getKnowledgeList, deleteKnowledge as dbDeleteKnowledge, clearKnowledge as dbClearKnowledge } from './services/database.js'
import { extractPdfText, chunkText } from './services/pdfService.js'
import auth from './middleware/auth.js'
import multer from 'multer'

dotenv.config()

// Inicialização segura do Firebase Admin
try {
  const serviceAccount = JSON.parse(fs.readFileSync(new URL('../firebase-adminsdk.json', import.meta.url)))
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }
} catch (e) {
  console.warn('⚠️ Aviso Firebase Admin:', e.message)
}

const app = express()

// Helper para obter o ID do usuário (Firebase Auth ou JWT legado)
const getUserId = (req) => req.user?.uid || req.user?.id || 'default_user'

// Configurações do Multer (limite de 50MB)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
})

// Middlewares Globais
app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(corsMiddleware)
app.use(express.json({ limit: '200mb' }))
app.use(express.urlencoded({ extended: true, limit: '200mb' }))

// Rate Limits ajustados
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }))
app.use('/api/chat', rateLimit({ windowMs: 15 * 60 * 1000, max: 150 }))

// Rotas Principais
app.use('/api/auth', authRoutes)
app.use('/api/auth', verifySupremoRoutes)
app.use('/api/chat', chatRoutes)

// Rota de Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', online: true }))

// Rotas da Base de Conhecimento
app.get('/api/knowledge/:id/content', auth, (req, res) => {
  try {
    const userId = getUserId(req)
    const row = db.prepare('SELECT id, filename, content FROM knowledge_base WHERE id = ? AND user_id = ?').get(req.params.id, userId)
    if (!row) return res.status(404).json({ error: 'Não encontrado' })
    res.json(row)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/knowledge/:id', auth, (req, res) => {
  try {
    const userId = getUserId(req)
    const { content, title } = req.body
    if (!content) return res.status(400).json({ error: 'Conteúdo obrigatório' })
    const chunks = content.match(/.{1,4000}/gs) || [content]
    db.prepare('UPDATE knowledge_base SET content = ?, chunks = ?, filename = ? WHERE id = ? AND user_id = ?')
      .run(content, JSON.stringify(chunks), title || 'texto', req.params.id, userId)
    res.json({ message: 'Atualizado' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/knowledge', auth, (req, res) => {
  try { res.json(getKnowledgeList(getUserId(req))) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/knowledge/text', auth, (req, res) => {
  try {
    const userId = getUserId(req)
    const { title, text } = req.body
    if (!title || !text) return res.status(400).json({ error: 'Título e texto obrigatórios' })
    const chunks = text.match(/.{1,4000}/gs) || [text]
    saveKnowledge(userId, title, 'txt', text, chunks)
    res.json({ message: 'Sucesso' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/knowledge/clear', auth, (req, res) => {
  try { dbClearKnowledge(getUserId(req)); res.json({ success: true }) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/knowledge/:id', auth, (req, res) => {
  try { dbDeleteKnowledge(getUserId(req), req.params.id); res.json({ success: true }) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/upload/pdf', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' })
    const userId = getUserId(req)
    const fullText = req.file.originalname.endsWith('.pdf') 
      ? await extractPdfText(req.file.buffer.toString('base64')) 
      : req.file.buffer.toString('utf8')
    const chunks = chunkText(fullText, 4000)
    saveKnowledge(userId, Buffer.from(req.file.originalname, 'latin1').toString('utf8'), req.file.originalname.endsWith('.pdf') ? 'pdf' : 'txt', fullText, chunks)
    res.json({ message: 'Sucesso' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/extract-pdf', auth, upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado' })
    const text = await extractPdfText(req.file.buffer.toString('base64'))
    res.json({ text: text.substring(0, 30000) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export const startServer = async () => { 
  initDatabase(); 
  app.listen(process.env.PORT || 3001, () => {
    console.log(`🚀 Hermes Backend rodando na porta ${process.env.PORT || 3001}`);
  }); 
}

export default app