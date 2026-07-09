// Uso: node scripts/listar-usuarios.js
// Lista todos os usuarios cadastrados no Firebase Auth deste projeto
import admin from "firebase-admin"
import fs from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(
  fs.readFileSync(join(__dirname, "../firebase-adminsdk.json"))
)

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
}

let total = 0

const listAllUsers = async (nextPageToken) => {
  const result = await admin.auth().listUsers(1000, nextPageToken)
  for (const u of result.users) {
    total++
    console.log(
      `${total}. ${u.email || "(sem email)"} | uid: ${u.uid} | criado: ${u.metadata.creationTime} | ultimo login: ${u.metadata.lastSignInTime || "nunca"}`
    )
  }
  if (result.pageToken) await listAllUsers(result.pageToken)
}

listAllUsers()
  .then(() => console.log(`\nTotal de usuarios cadastrados: ${total}`))
  .catch((err) => {
    console.error("Erro ao listar usuarios:", err.message)
    process.exit(1)
  })
