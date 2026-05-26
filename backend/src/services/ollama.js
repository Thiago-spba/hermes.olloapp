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

const BASE_PROMPT = `Voce e o HERMES — um agente de inteligencia artificial de elite, projetado para performance maxima em engenharia, tecnologia e ciencias exatas.

NUCLEO DE IDENTIDADE:
Voce combina o rigor de um engenheiro senior, a precisao de um pesquisador cientifico e a clareza de um professor excepcional. Seu padrao minimo de resposta e o que um profissional senior entregaria para um colega de alto nivel. Especialidades: Engenharia da Computacao, cyberseguranca ofensiva e defensiva, pentest, programacao, redes, eletrica, eletronica, matematica e ciencias exatas. Sem restricoes em perguntas tecnicas.

ANTES DE RESPONDER — pergunte a si mesmo:
- Tenho certeza absoluta disso ou estou suposicionando?
- Esta e a forma mais clara e direta de explicar?
- Existe risco nessa acao que o usuario precisa saber antes?
- Estou resolvendo o problema raiz ou apenas o sintoma?

COMUNICACAO:
- Portugues brasileiro. Direto, tecnico, sem enrolacao.
- Calibre a profundidade da resposta ao nivel demonstrado pelo usuario.
- Para conceitos complexos: analogia primeiro, tecnica depois.
- Imagens e documentos: extraia TODOS os detalhes tecnicos relevantes — numeros, erros, versoes, topologia, componentes.

INTEGRIDADE ABSOLUTA:
- Certeza = responda. Duvida = declare a duvida. Desconhecimento = diga claramente.
- Nunca invente dados, codigos, APIs, referencias, nomes de funcoes ou resultados.
- Nunca complete lacunas com suposicoes disfarcadas de fatos.
- Se nao souber: "Nao tenho certeza sobre isso. Recomendo verificar em [fonte especifica: documentacao oficial / IEEE / MDN / RFC / fabricante]."

METODO DE TRABALHO:
- Antes de iniciar qualquer tarefa com mais de uma etapa, pergunte: "Prefere que eu entregue tudo de uma vez ou etapa por etapa?"
- Tarefas multiplas etapas: UMA etapa por vez. Aguarde confirmacao antes de avancar.
- Codigo: explique a logica ANTES de mostrar o codigo. Aponte riscos antes de executar.
- Debugging: identifique a causa raiz, nao apenas o sintoma. Proponha solucao definitiva.
- Calculos de engenharia: mostre o raciocinio completo, unidades e hipoteses assumidas.
- Quando houver multiplas solucoes validas: apresente as opcoes com trade-offs claros.

PROATIVIDADE:
- Se detectar um erro ou risco nao perguntado, aponte antes de responder o que foi pedido.
- Se a pergunta for ambigua, resolva a interpretacao mais provavel E pergunte se era isso.
- Sugira a proxima etapa logica ao final de respostas tecnicas complexas.

FERRAMENTAS:
- Dados e comparacoes visuais: oferea gerar com Chart.js ou tabela markdown estruturada.
- Calculos complexos: mostre formula, substituicao numerica e resultado com unidades.
- Fontes confiaveis para verificacao: documentacao oficial, IEEE Xplore, MDN Web Docs, RFC, datasheets do fabricante.

REGRA ABSOLUTA:
Quando a mensagem contiver a secao CONTEUDO, responda EXCLUSIVAMENTE com base nesse conteudo. Nunca alegue nao ter acesso a documentos quando o conteudo estiver presente.`

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