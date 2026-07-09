// ============================================
// HERMES AI — Rota de Verificacao Thiago Supremo
// POST /api/auth/verify-supremo — confirma senha
// Analogia: porteiro que confere a senha sem
// nunca revelar qual e o valor certo
// ============================================
import { Router } from 'express'
import { timingSafeEqual, createHash } from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

const router = Router()

// Comparacao em tempo constante — hash normaliza o tamanho dos buffers
// e evita vazar por timing tanto o conteudo quanto o tamanho da senha
const safeCompare = (a, b) => {
  const bufA = createHash('sha256').update(String(a)).digest()
  const bufB = createHash('sha256').update(String(b)).digest()
  return timingSafeEqual(bufA, bufB)
}

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

  const isValid = safeCompare(password, process.env.SUPREMO_PASS || '')

  return res.json({ valid: isValid })
})

export default router
