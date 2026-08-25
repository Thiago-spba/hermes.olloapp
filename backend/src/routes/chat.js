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
    const { 
      message, 
      image, 
      images, 
      audio, 
      audioMime, 
      modelKey, 
      history: frontendHistory, 
      studyMode, 
      useRAG, 
      projectContext 
    } = req.body

    // Compatibilidade com Firebase Auth (req.user.uid) ou JWT (req.user.id)
    const userId = req.user?.uid || req.user?.id || "default_user"

    // Compatibilidade: lê tanto array 'images' (frontend) quanto string 'image'
    const selectedImage = (Array.isArray(images) && images.length > 0) ? images[0] : (image || null)

    let finalMessage = (message || "").trim()

    // 1. Comando de memória rápida (/lembrar)
    if (finalMessage.startsWith("/lembrar ")) {
      const fact = finalMessage.slice(9).trim()
      const [key, ...rest] = fact.split(":")
      if (key && rest.length) {
        saveMemory(userId, key.trim(), rest.join(":").trim())
        res.setHeader("Content-Type", "text/event-stream")
        res.setHeader("Cache-Control", "no-cache")
        res.setHeader("Connection", "keep-alive")
        res.setHeader("X-Accel-Buffering", "no")
        res.flushHeaders()
        res.write(`data: ${JSON.stringify({ token: "Memória salva com sucesso!" })}\n\n`)
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
        res.end()
        return
      }
    }

    // 2. Transcrição de áudio se enviado
    if (audio) {
      try {
        const transcribed = await transcribeAudio(audio, audioMime || "audio/wav")
        if (transcribed) {
          finalMessage = finalMessage ? `${finalMessage} ${transcribed}` : transcribed
        }
      } catch (whisperError) {
        console.error("Whisper ERRO:", whisperError.message)
      }
    }

    // Fallback de texto se houver imagem sem mensagem digitada
    if (!finalMessage && selectedImage) {
      finalMessage = "Descreva e analise esta imagem."
    }

    // 3. Base de conhecimento (RAG)
    if (!selectedImage && (useRAG || (getKnowledgeChunks(userId) && getKnowledgeChunks(userId).length > 0))) {
      try {
        const allChunks = getKnowledgeChunks(userId) || []
        if (allChunks.length > 0) {
          const query = finalMessage || "resuma os documentos"
          const texts = allChunks.map(c => c.text || "")
          const relevant = findRelevantChunks(texts, query, 2).map(c => c.substring(0, 400)).join("\n\n---\n\n")
          if (relevant) {
            finalMessage = `${query}\n\n<context>\n${relevant}\n</context>`
          }
        }
      } catch (ragError) {
        console.error("Erro RAG:", ragError.message)
      }
    }

    // 4. Injeção do Contexto do Projeto Ativo
    if (projectContext && String(projectContext).trim()) {
      finalMessage = `${finalMessage}\n\n<projeto_ativo>\n${projectContext.trim()}\n</projeto_ativo>`
    }

    // 5. Memória persistente
    const memory = typeof getMemoryAsText === "function" ? getMemoryAsText(userId) : ""

    // 6. Salvar mensagem do usuário no banco local
    if (finalMessage) {
      saveMessage(userId, "user", message || finalMessage)
    }

    // 7. Sanitizar e formatar o histórico
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

    // 8. Configurar SSE para streaming em tempo real
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("X-Accel-Buffering", "no")
    res.flushHeaders()

    let fullResponse = ""

    for await (const token of chatStream(finalMessage, sessionHistory, selectedImage, modelKey || "auto", memory, studyMode || false)) {
      fullResponse += token
      res.write(`data: ${JSON.stringify({ token })}\n\n`)
    }

    // 9. Salvar resposta da IA e finalizar SSE
    saveMessage(userId, "assistant", fullResponse)
    res.write(`data: ${JSON.stringify({ done: true, modelKey: modelKey || "auto" })}\n\n`)
    res.end()

    // 10. Extração de memórias em segundo plano
    if (message && fullResponse && !selectedImage && typeof extractMemoryFacts === "function") {
      extractMemoryFacts(message, fullResponse).then(facts => {
        if (Array.isArray(facts)) {
          for (const fact of facts) {
            if (fact?.key && fact?.value) {
              saveMemory(userId, fact.key, fact.value)
              console.log(`[Memória] ${fact.key}: ${fact.value}`)
            }
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

router.post("/memory", auth, async (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id || "default_user"
    const { key, value } = req.body
    if (!key || !value) return res.status(400).json({ error: "key e value obrigatórios." })
    saveMemory(userId, key, value)
    res.json({ message: "Memória salva com sucesso." })
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar memória." })
  }
})

router.get("/memory", auth, (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id || "default_user"
    const memories = getMemory(userId)
    res.json({ memories })
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar memórias." })
  }
})

router.get("/history", auth, (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id || "default_user"
    const history = getHistory(userId, 50)
    res.json({ history })
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar histórico." })
  }
})

router.delete("/history", auth, (req, res) => {
  try {
    const userId = req.user?.uid || req.user?.id || "default_user"
    clearHistory(userId)
    res.json({ message: "Histórico limpo com sucesso." })
  } catch (error) {
    res.status(500).json({ error: "Erro ao limpar histórico." })
  }
})

export default router