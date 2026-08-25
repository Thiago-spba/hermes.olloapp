// ============================================
// HERMES AI — Middleware CORS
// Controla quais origens podem acessar a API
// CORS = Cross-Origin Resource Sharing
// Analogia: lista VIP da balada — só entra quem está na lista
// ============================================

import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

// Origens padrão do ecossistema Hermes
const defaultOrigins = [
  'https://hermes.olloapp.com.br',
  'https://api.hermes.olloapp.com.br',
  'https://hermes-ai-agent-44a54.web.app',
  'https://hermes-ai-agent-44a54.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173'
]

// Lê do .env se configurado, removendo espaços acidentais, e mescla com as origens padrão
const envOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : []

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]))

const corsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: mobile apps, curl, ferramentas de terminal, Postman)
    if (!origin) return callback(null, true)

    // Permite se estiver na lista explícita ou for qualquer subdomínio do seu domínio principal
    const isAllowed = 
      allowedOrigins.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.olloapp\.com\.br$/i.test(origin)

    if (isAllowed) {
      callback(null, true)
    } else {
      console.warn(`[CORS] ❌ Origem bloqueada: ${origin}`)
      callback(new Error(`Origem bloqueada pelo CORS: ${origin}`))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400, // Cache das permissões por 24h no navegador
}

export default cors(corsOptions)