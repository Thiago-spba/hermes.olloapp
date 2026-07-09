import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

const getToken = () => {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      auth.currentUser.getIdToken(false).then(resolve).catch(() => resolve(null))
      return
    }
    const timeout = setTimeout(() => { unsub(); resolve(null) }, 8000)
    const unsub = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout)
      unsub()
      if (user) user.getIdToken(false).then(resolve).catch(() => resolve(null))
      else resolve(null)
    })
  })
}

const authHeaders = async (json = false) => {
  const token = await getToken()
  const headers = {}
  if (json) headers["Content-Type"] = "application/json"
  if (token) headers["Authorization"] = `Bearer ${token}`
  return headers
}

export const sendMessage = async (message, history = [], images = [], onToken = null, audio = null, audioMime = null, modelKey = "auto", studyMode = false, useRAG = false, projectContext = "") => {
  const headers = await authHeaders(true)
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: message || "",
      history: history || [],
      ...(images && images.length && { images }),
      ...(audio && { audio }),
      ...(audioMime && { audioMime }),
      modelKey,
      studyMode: studyMode || false,
      useRAG: useRAG || false,
      ...(projectContext && { projectContext }),
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || `Erro ${response.status}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullResponse = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split("\n").filter(l => l.startsWith("data: "))
    for (const line of lines) {
      let json
      try {
        json = JSON.parse(line.replace("data: ", ""))
      } catch {
        continue
      }
      // json.error precisa propagar de verdade -- antes ficava preso no
      // mesmo try/catch do JSON.parse e era engolido silenciosamente,
      // fazendo o chat parecer "sem resposta" quando o servidor falhava
      // no meio do streaming (timeout, erro do provedor, etc.)
      if (json.error) throw new Error(json.error)
      if (json.token) {
        fullResponse += json.token
        if (onToken) onToken(json.token, false, null)
      }
      if (json.done && json.modelKey && onToken) {
        onToken("", true, json.modelKey)
      }
    }
  }

  return fullResponse
}

export const uploadPDF = async (file) => {
  const headers = await authHeaders(false)
  const formData = new FormData()
  formData.append("file", file)
  const response = await fetch(`${API_URL}/api/knowledge`, {
    method: "POST", headers, body: formData,
  })
  if (!response.ok) throw new Error((await response.json()).error || `Erro ${response.status}`)
  return response.json()
}

export const checkHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}

export const MODELS = {
  "thiago-analiza":      { name: "🔎 Thiago Analiza",      provider: "cohere",    free: true },
  "thiago-jr":           { name: "⚙️ Thiago Jr",           provider: "mistral",   free: true },
  "thiago-senior":       { name: "🧠 Thiago Sênior",       provider: "groq",      free: true },
  "thiago-doutor":       { name: "🎓 Thiago Doutor",       provider: "anthropic", free: false },
  "thiago-especialista": { name: "🔬 Thiago Especialista", provider: "anthropic", free: false },
  "thiago-supremo":      { name: "👑 Thiago Supremo",      provider: "anthropic", free: false },
}

// --- BASE DE CONHECIMENTO ---
export const uploadKnowledge = async (files) => {
  const headers = await authHeaders(false)
  const results = { uploaded: [], errors: [] }
  for (const file of files) {
    try {
      const formData = new FormData()
      formData.append("file", file)
      const response = await fetch(`${API_URL}/api/knowledge`, { method: "POST", headers, body: formData })
      if (!response.ok) throw new Error("Erro ao fazer upload")
      results.uploaded.push(file.name)
    } catch { results.errors.push(file.name) }
  }
  return results
}

export const saveTextKnowledge = async (title, text) => {
  const headers = await authHeaders(true)
  const response = await fetch(`${API_URL}/api/knowledge/text`, {
    method: "POST", headers,
    body: JSON.stringify({ title, text })
  })
  if (!response.ok) throw new Error("Erro ao salvar texto")
  return response.json()
}

export const listKnowledge = async () => {
  const headers = await authHeaders(false)
  const response = await fetch(`${API_URL}/api/knowledge`, { method: "GET", headers })
  if (!response.ok) throw new Error("Erro ao listar")
  const data = await response.json()
  return { files: Array.isArray(data) ? data.map(f => ({ ...f, filetype: f.filetype || (f.filename?.endsWith(".pdf") ? "pdf" : "txt") })) : [] }
}

export const deleteKnowledge = async (id) => {
  const headers = await authHeaders(false)
  const response = await fetch(`${API_URL}/api/knowledge/${id}`, { method: "DELETE", headers })
  if (!response.ok) throw new Error("Erro ao deletar")
  return response.json()
}

export const clearKnowledge = async () => {
  const headers = await authHeaders(false)
  const response = await fetch(`${API_URL}/api/knowledge/clear`, { method: "DELETE", headers })
  if (!response.ok) throw new Error("Erro ao limpar")
  return response.json()
}

export const getKnowledgeContent = async (id) => {
  const headers = await authHeaders(false)
  const response = await fetch(`${API_URL}/api/knowledge/${id}/content`, { method: 'GET', headers })
  if (!response.ok) throw new Error('Erro ao buscar conteudo')
  return response.json()
}

export const updateKnowledge = async (id, title, content) => {
  const headers = await authHeaders(true)
  const response = await fetch(`${API_URL}/api/knowledge/${id}`, {
    method: 'PUT', headers,
    body: JSON.stringify({ title, content })
  })
  if (!response.ok) throw new Error('Erro ao atualizar')
  return response.json()
}

export const extractPdfText = async (file) => {
  const headers = await authHeaders(false)
  const formData = new FormData()
  formData.append("pdf", file)
  const response = await fetch(`${API_URL}/api/extract-pdf`, { method: "POST", headers, body: formData })
  if (!response.ok) throw new Error("Erro ao extrair PDF")
  const data = await response.json()
  return data.text || ""
}