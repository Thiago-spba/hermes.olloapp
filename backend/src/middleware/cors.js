// ============================================
// HERMES AI — Middleware CORS
// Controla quais origens podem acessar a API
// CORS = Cross-Origin Resource Sharing
// Analogia: lista VIP da balada — só entra quem está na lista
// ============================================

import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

// Origens permitidas — lê do .env
// Em dev: localhost:5173 | Em prod: hermes.olloapp.com.br
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173']

const corsOptions = {
  origin: (origin, callback) => {
    // Permite requisições sem origin (ex: mobile apps, Postman em dev)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`Origem bloqueada pelo CORS: ${origin}`))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // Cache das permissões por 24h no navegador
}

export default cors(corsOptions)