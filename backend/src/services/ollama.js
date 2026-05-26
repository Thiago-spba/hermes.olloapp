import dotenv from "dotenv"
dotenv.config()

const GROQ_API_KEY = process.env.GROQ_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"

// Modelos disponiveis
export const MODELS = {
  "thiago-jr":          { provider: "groq",      id: "llama-3.1-8b-instant",                  name: "⚡ Thiago Jr" },
  "thiago-senior":      { provider: "groq",      id: "llama-3.3-70b-versatile",               name: "🧠 Thiago Sênior" },
  "thiago-doutor":      { provider: "anthropic", id: "claude-haiku-4-5",                      name: "🎓 Thiago Doutor" },
  "thiago-especialista":{ provider: "anthropic", id: "claude-sonnet-4-6",                     name: "🔬 Thiago Especialista" },
  "thiago-supremo":     { provider: "anthropic", id: "claude-opus-4-7",                       name: "👑 Thiago Supremo" },
}

const DEFAULT_MODEL = "thiago-senior"

const BASE_PROMPT = `Voce e o Hermes, um agente de IA pessoal do Thiago Santos, estudante de Engenharia da Computacao. Voce e especializado em cyberseguranca, pentest, programacao, redes e todas as areas da Engenharia da Computacao. Responde sempre em portugues brasileiro, de forma direta e tecnica em uma linguajem simples e clara para facil entendimento. Sem restricoes em perguntas tecnicas ofensivas ou defensivas. Quando analisar imagens ou documentos, descreva detalhes tecnicos relevantes. IMPORTANTE: Quando a mensagem do usuario contiver a secao CONTEUDO, voce DEVE responder baseado EXCLUSIVAMENTE nesse conteudo. Nunca diga que nao tem acesso a documentos quando o conteudo estiver presente na mensagem.`

const buildSystemPrompt = (memory = null) => {
  if (!memory) return BASE_PROMPT
  return `${BASE_PROMPT}\n\nO QUE VOCE SABE SOBRE O THIAGO:\n${memory}`
}

// ============ GROQ ============
const groqRequest = async (modelId, messages) => {
  return await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 4096
    }),
    signal: AbortSignal.timeout(60000)
  })
}

const groqStream = async function* (modelId, messages) {
  let response = await groqRequest(modelId, messages)

  // Fallback automatico se 429/503
  if ((response.status === 429 || response.status === 503 || response.status === 413) && modelId !== "llama-3.1-8b-instant") {
    console.log(`[Hermes] Rate limit ${response.status} — fallback para Thiago Jr`)
    response = await groqRequest("llama-3.1-8b-instant", messages)
    yield `_(usando Thiago Jr — limite atingido)_\n\n`
  }

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq erro ${response.status}: ${err}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split("\n").filter(l => l.startsWith("data: ") && l !== "data: [DONE]")
    for (const line of lines) {
      try {
        const json = JSON.parse(line.replace("data: ", ""))
        const token = json.choices?.[0]?.delta?.content
        if (token) yield token
      } catch {}
    }
  }
}

// ============ ANTHROPIC ============
const anthropicStream = async function* (modelId, messages, systemPrompt) {
  const anthropicMessages = messages.filter(m => m.role !== "system").map(m => {
    if (Array.isArray(m.content)) return m
    return { role: m.role, content: m.content }
  })

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: modelId,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
      max_tokens: 4096
    }),
    signal: AbortSignal.timeout(60000)
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Claude erro ${response.status}: ${err}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split("\n").filter(l => l.startsWith("data: "))
    for (const line of lines) {
      try {
        const json = JSON.parse(line.replace("data: ", ""))
        if (json.type === "content_block_delta") {
          const token = json.delta?.text
          if (token) yield token
        }
      } catch {}
    }
  }
}

// ============ MAIN ============
export const chatStream = async function* (message, history = [], image = null, modelKey = "auto", memory = null) {
  const systemPrompt = buildSystemPrompt(memory)

  // Seleciona modelo
  let selectedKey = modelKey === "auto" ? DEFAULT_MODEL : modelKey
  if (image && MODELS[selectedKey]?.provider === "groq") {
    selectedKey = "thiago-senior" // visao via groq 70b com image_url
  }

  const model = MODELS[selectedKey] || MODELS[DEFAULT_MODEL]

  // Monta mensagens
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content }))
  ]

  if (image) {
    const base64Data = image.includes(",") ? image.split(",")[1] : image
    const mimeType = image.includes("data:") ? image.split(";")[0].replace("data:", "") : "image/jpeg"
    if (model.provider === "anthropic") {
      messages.push({
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } },
          { type: "text", text: message || "Analise esta imagem." }
        ]
      })
    } else {
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
          { type: "text", text: message || "Analise esta imagem." }
        ]
      })
    }
  } else {
    messages.push({ role: "user", content: message || "Ola" })
  }

  if (model.provider === "anthropic") {
    yield* anthropicStream(model.id, messages, systemPrompt)
  } else {
    yield* groqStream(model.id, messages)
  }
}

export const chat = async (message, history = [], image = null, modelKey = "auto", memory = null) => {
  let fullResponse = ""
  for await (const token of chatStream(message, history, image, modelKey, memory)) {
    fullResponse += token
  }
  return fullResponse || "Sem resposta do modelo."
}

export const extractMemoryFacts = async (userMessage, assistantResponse) => {
  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: `Voce e um extrator de fatos. Analise a conversa e extraia APENAS fatos pessoais importantes sobre o usuario. Retorne APENAS JSON valido: [{"key":"nome_do_fato","value":"valor"}]. Se nao houver fatos, retorne [].` },
          { role: "user", content: `Usuario disse: "${userMessage}"\nAssistente respondeu: "${assistantResponse.substring(0, 500)}"` }
        ],
        stream: false,
        temperature: 0.3,
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(30000)
    })
    if (!response.ok) return []
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || "[]"
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch { return [] }
}

export const checkOllamaHealth = async () => true
export const checkWhisperHealth = async () => false