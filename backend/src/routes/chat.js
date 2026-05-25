import { Router } from "express"
import auth from "../middleware/auth.js"
import { validateChat } from "../middleware/sanitize.js"
import { chatStream, extractMemoryFacts } from "../services/ollama.js"
import { transcribeAudio } from "../services/whisper.js"
import { saveMessage, getHistory, clearHistory, getPdfContext, getMemoryAsText, saveMemory } from "../services/database.js"
import { findRelevantChunks } from "../services/pdfService.js"
import { buildKnowledgeContext } from "../services/knowledgeService.js"

const router = Router()

router.post("/", auth, validateChat, async (req, res) => {
  try {
    const { message, image, audio, audioMime } = req.body
    const userId = req.user.id
    let finalMessage = message || ""

    // Transcricao de audio
    if (audio) {
      try {
        const transcribed = await transcribeAudio(audio, audioMime || "audio/webm")
        if (transcribed) finalMessage = `${finalMessage} ${transcribed}`.trim()
      } catch (whisperError) {
        console.error("Whisper ERRO:", whisperError.message)
      }
    }

    // Contexto do PDF (sessao atual)
    const pdfContext = getPdfContext(userId)
    if (pdfContext && !image) {
      const query = finalMessage || "resuma este documento"
      const relevantChunks = findRelevantChunks(pdfContext.chunks, query, 3)
      const pdfText = relevantChunks.join("\n\n---\n\n")
      finalMessage = `${query}\n\nCONTEUDO DO DOCUMENTO "${pdfContext.filename}":\n\n${pdfText}`
    }

    // Base de conhecimento (multiplos arquivos persistentes)
    if (!pdfContext && !image) {
      const knowledgeContext = buildKnowledgeContext(userId, finalMessage)
      if (knowledgeContext) {
        finalMessage = `${finalMessage}\n\n${knowledgeContext}`
      }
    }

    // Memoria persistente
    const memory = getMemoryAsText(userId)

    if (finalMessage) saveMessage(userId, "user", message || "[Audio enviado]")

    const dbHistory = getHistory(userId, 20)

    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()

    let fullResponse = ""

    for await (const token of chatStream(finalMessage, dbHistory, image || null, "auto", memory)) {
      fullResponse += token
      res.write(`data: ${JSON.stringify({ token })}\n\n`)
    }

    saveMessage(userId, "assistant", fullResponse)
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
    res.end()

    // Extrai fatos da conversa em background (nao bloqueia a resposta)
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
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      res.end()
    }
  }
})

// Salvar memoria manualmente
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

// Ver memorias salvas
router.get("/memory", auth, (req, res) => {
  try {
    const { getMemory } = require("../services/database.js")
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