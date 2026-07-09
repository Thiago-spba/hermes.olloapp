import { Router } from "express"
import auth from "../middleware/auth.js"
import { validateChat } from "../middleware/sanitize.js"
import { chatStream, extractMemoryFacts } from "../services/ollama.js"
import { transcribeAudio } from "../services/whisper.js"
import { saveMessage, getKnowledgeChunks, getMemoryAsText, saveMemory, getMemory, getHistory, clearHistory } from "../services/database.js"
import { findRelevantChunks } from "../services/pdfService.js"

const router = Router()

router.post("/", auth, validateChat, async (req, res) => {
  try {
    const { message, image, audio, audioMime, modelKey, history: frontendHistory, studyMode, useRAG, projectContext } = req.body
    const userId = req.user.id
    let finalMessage = message || ""

    if (finalMessage.startsWith("/lembrar ")) {
      const fact = finalMessage.slice(9).trim()
      const [key, ...rest] = fact.split(":")
      if (key && rest.length) {
        saveMemory(userId, key.trim(), rest.join(":").trim())
        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.flushHeaders()
        res.write(`data: ${JSON.stringify({ token: "Memoria salva!" })}

`)
        res.write(`data: ${JSON.stringify({ done: true })}

`)
        res.end()
        return
      }
    }

    if (audio) {
      try {
        const transcribed = await transcribeAudio(audio, audioMime || "audio/webm")
        if (transcribed) finalMessage = `${finalMessage} ${transcribed}`.trim()
      } catch (whisperError) {
        console.error("Whisper ERRO:", whisperError.message)
      }
    }

    if (!image && (useRAG || getKnowledgeChunks(userId).length > 0)) {
      const allChunks = getKnowledgeChunks(userId)
      if (allChunks.length > 0) {
        const query = finalMessage || "resuma"
        const texts = allChunks.map(c => c.text)
        const relevant = findRelevantChunks(texts, query, 8).join("\n\n---\n\n")
        finalMessage = `${query}\n\n<context>${relevant}</context>`
      }
    }

    if (projectContext && projectContext.trim()) {
      finalMessage = `${finalMessage}\n\n<projeto_ativo>${projectContext}</projeto_ativo>`
    }

    const memory = getMemoryAsText(userId)

    if (finalMessage) saveMessage(userId, "user", message || "[Audio enviado]")

    const sessionHistory = Array.isArray(frontendHistory)
      ? frontendHistory
          .filter(m => m && m.content && (m.role === "user" || m.role === "assistant"))
          .map(m => ({
            role: m.role,
            content: typeof m.content === "string" ? m.content :
              Array.isArray(m.content) ? m.content.filter(c => c.type === "text").map(c => c.text).join(" ") || "[imagem]" :
              String(m.content || "")
          }))
      : []

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()

    let fullResponse = ""

    for await (const token of chatStream(finalMessage, sessionHistory, image || null, modelKey || "auto", memory, studyMode || false)) {
      fullResponse += token
      res.write(`data: ${JSON.stringify({ token })}

`)
    }

    saveMessage(userId, "assistant", fullResponse)
    res.write(`data: ${JSON.stringify({ done: true, modelKey: modelKey || "auto" })}

`)
    res.end()

    if (message && fullResponse && !image) {
      extractMemoryFacts(message, fullResponse).then(facts => {
        for (const fact of facts) {
          if (fact.key && fact.value) {
            saveMemory(userId, fact.key, fact.value)
            console.log(`[Memoria] ${fact.key}: ${fact.value}`)
          }
        }
      }).catch(() => {})
    }

  } catch (error) {
    console.error("Erro no chat:", error.message)
    if (!res.headersSent) {
      res.status(500).json({ error: error.message })
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}

`)
      res.end()
    }
  }
})

router.post("/memory", auth, async (req, res) => {
  try {
    const { key, value } = req.body
    if (!key || !value) return res.status(400).json({ error: "key e value obrigatorios." })
    saveMemory(req.user.id, key, value)
    res.json({ message: "Memoria salva com sucesso." })
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar memoria." })
  }
})

router.get("/memory", auth, (req, res) => {
  try {
    const memories = getMemory(req.user.id)
    res.json({ memories })
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar memorias." })
  }
})

router.get("/history", auth, (req, res) => {
  try {
    const history = getHistory(req.user.id, 50)
    res.json({ history })
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar historico." })
  }
})

router.delete("/history", auth, (req, res) => {
  try {
    clearHistory(req.user.id)
    res.json({ message: "Historico limpo com sucesso." })
  } catch (error) {
    res.status(500).json({ error: "Erro ao limpar historico." })
  }
})

export default router