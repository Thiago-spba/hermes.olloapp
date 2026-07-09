import bcrypt from 'bcryptjs'
import { timingSafeEqual, createHash } from 'crypto'

const isBcryptHash = (value) => /^\$2[aby]\$/.test(value || '')

// Comparacao em tempo constante para o modo texto puro (transicao)
const safeCompare = (a, b) => {
  const bufA = createHash('sha256').update(String(a)).digest()
  const bufB = createHash('sha256').update(String(b)).digest()
  return timingSafeEqual(bufA, bufB)
}

// Aceita hash bcrypt no .env (recomendado) ou texto puro (modo de
// transicao, ainda funciona mas avisa no log para migrar)
export const verifyPassword = (input, stored) => {
  if (!input || !stored) return false
  if (isBcryptHash(stored)) return bcrypt.compareSync(input, stored)
  console.warn('⚠️  Senha em texto puro no .env — gere um hash com "node scripts/gerar-hash-senha.js <senha>" e substitua o valor da variavel.')
  return safeCompare(input, stored)
}
