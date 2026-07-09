// ============================================
// HERMES AI — Rota de Verificacao Thiago Supremo
// POST /api/auth/verify-supremo — confirma senha
// Analogia: porteiro que confere a senha sem
// nunca revelar qual e o valor certo
// ============================================
import { Router } from 'express'
import dotenv from 'dotenv'
import { verifyPassword } from '../utils/verifyPassword.js'
dotenv.config()

const router = Router()

// ============================================
// POST /api/auth/verify-supremo
// Body: { password }
// Retorna: { valid: true/false }
// ============================================
router.post('/verify-supremo', (req, res) => {
  const { password } = req.body

  if (!password) {
    return res.status(400).json({ error: 'Senha obrigatoria.' })
  }

  const isValid = verifyPassword(password, process.env.SUPREMO_PASS)

  return res.json({ valid: isValid })
})

export default router
