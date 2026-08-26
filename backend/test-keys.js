import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

async function showGroqModels() {
  try {
    const r = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
    })
    const data = await r.json()
    console.log('\n--- 📋 MODELOS DISPONÍVEIS NA SUA GROQ ---')
    console.log(data.data.map(m => m.id))
    console.log('-------------------------------------------\n')
  } catch (e) {
    console.error('Erro:', e.message)
  }
}

showGroqModels()
