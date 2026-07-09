// Uso: node scripts/gerar-hash-senha.js "minhaSenhaAtual"
// Gera um hash bcrypt para colar no .env no lugar da senha em texto puro
// (USER1_PASS, USER2_PASS ou SUPREMO_PASS). O nome da variavel nao muda.
import bcrypt from 'bcryptjs'

const senha = process.argv[2]

if (!senha) {
  console.error('Uso: node scripts/gerar-hash-senha.js "minhaSenha"')
  process.exit(1)
}

console.log(bcrypt.hashSync(senha, 12))
