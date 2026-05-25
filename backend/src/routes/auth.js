// ============================================
// HERMES AI — Rota de Autenticação
// POST /api/auth/login — gera token JWT
// Analogia: balcão de recepção que entrega
// o crachá após verificar identidade
// ============================================

import { Router } from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { validateLogin } from '../middleware/sanitize.js'

dotenv.config()

const router = Router()

// Usuários autorizados — carregados do .env
const USERS = [
  {
    id: 'user_1',
    name: process.env.USER1_NAME,
    password: process.env.USER1_PASS,
  },
  {
    id: 'user_2',
    name: process.env.USER2_NAME,
    password: process.env.USER2_PASS,
  },
]

// ============================================
// POST /api/auth/login
// Body: { username, password }
// Retorna: { token, user }
// ============================================
router.post('/login', validateLogin, (req, res) => {
  const { username, password } = req.body

  // Busca usuário pelo nome
  const user = USERS.find(
    u => u.name === username && u.password === password
  )

  if (!user) {
    // Mensagem genérica — não revela se o usuário existe
    return res.status(401).json({ error: 'Credenciais inválidas.' })
  }

  // Gera token JWT com dados do usuário
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  )

  res.json({
    token,
    user: { id: user.id, name: user.name },
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  })
})

export default router