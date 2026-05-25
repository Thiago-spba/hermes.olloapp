import { createRequire } from "module"
const require = createRequire(import.meta.url)
const pdfParse = require("pdf-parse")

// Extrai texto do PDF e divide em chunks de 4000 caracteres
export const extractPdfText = async (base64Data) => {
  const buffer = Buffer.from(base64Data, "base64")
  const data = await pdfParse(buffer)
  return data.text
}

// Divide texto em blocos menores para o modelo processar
export const chunkText = (text, chunkSize = 4000) => {
  const chunks = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize))
    i += chunkSize
  }
  return chunks
}

// Busca os chunks mais relevantes para a pergunta do usuario
export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
  const queryWords = query.toLowerCase().split(" ").filter(w => w.length > 3)

  const scored = chunks.map((chunk, index) => {
    const chunkLower = chunk.toLowerCase()
    const score = queryWords.reduce((acc, word) => {
      const matches = (chunkLower.match(new RegExp(word, "g")) || []).length
      return acc + matches
    }, 0)
    return { chunk, score, index }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .sort((a, b) => a.index - b.index)
    .map(item => item.chunk)
}