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
import knowledgeRoutes from './routes/knowledge.js'
import { initDatabase } from './services/database.js'
import { checkOllamaHealth } from './services/ollama.js'
import { checkWhisperHealth } from './services/whisper.js'
import { extractPdfText, chunkText } from './services/pdfService.js'
import { savePdfContext } from './services/database.js'
import auth from './middleware/auth.js'

dotenv.config()

const require = createRequire(import.meta.url)
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

// Inicializa Firebase Admin
try {
  const serviceAccount = JSON.parse(fs.readFileSync('./firebase-adminsdk.json', 'utf8'))
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    console.log('✅ Firebase Admin inicializado')
  }
} catch (e) {
  console.warn('⚠️ Firebase Admin nao inicializado:', e.message)
}

const app = express()

app.use(helmet())
app.use(corsMiddleware)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisicoes. Tente novamente em 15 minutos.' }
})

const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de mensagens atingido. Aguarde 15 minutos.' }
})

app.use('/api/', generalLimiter)
app.use('/api/chat', chatLimiter)
app.use('/api/auth', authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/knowledge', auth, knowledgeRoutes)

app.post('/api/upload/pdf', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'PDF nao enviado.' })
    const base64 = req.file.buffer.toString('base64')
    const fullText = await extractPdfText(base64)
    const chunks = chunkText(fullText, 4000)
    savePdfContext(req.user.id, req.file.originalname, fullText, chunks)
    res.json({
      message: 'PDF processado com sucesso',
      pages: chunks.length,
      preview: fullText.substring(0, 200)
    })
  } catch (error) {
    console.error('Erro ao processar PDF:', error.message)
    res.status(500).json({ error: 'Erro ao processar PDF: ' + error.message })
  }
})

app.get('/api/health', async (req, res) => {
  const ollamaOnline = await checkOllamaHealth()
  const whisperOnline = await checkWhisperHealth()
  res.json({
    status: 'online',
    services: { api: true, ollama: ollamaOnline, whisper: whisperOnline },
    timestamp: new Date().toISOString(),
  })
})

app.use((err, req, res, next) => {
  console.error('Erro nao tratado:', err.message)
  if (err.message.includes('CORS')) return res.status(403).json({ error: 'Acesso negado.' })
  res.status(500).json({ error: 'Erro interno do servidor.' })
})

export const startServer = async () => {
  initDatabase()
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`✅ Hermes API rodando na porta ${PORT}`)
  })
}

export default app