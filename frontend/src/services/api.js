import { auth } from "./firebase"
import { onAuthStateChanged } from "firebase/auth"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

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

export const sendMessage = async (message, history = [], image = null, onToken = null, audio = null, audioMime = null, modelKey = "auto") => {
  const headers = await authHeaders(true)
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: message || "",
      image: image || null,
      audio: audio || null,
      audioMime: audioMime || null,
      modelKey,
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
      try {
        const json = JSON.parse(line.replace("data: ", ""))
        if (json.token) {
          fullResponse += json.token
          if (onToken) onToken(json.token)
        }
        if (json.error) throw new Error(json.error)
      } catch {}
    }
  }

  return fullResponse
}

export const uploadPDF = async (file) => {
  const headers = await authHeaders(false)
  const formData = new FormData()
  formData.append("file", file)
  const response = await fetch(`${API_URL}/api/upload/pdf`, {
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
  "thiago-jr":           { name: "⚡ Thiago Jr",           provider: "groq",      free: true },
  "thiago-senior":       { name: "🧠 Thiago Sênior",       provider: "groq",      free: true },
  "thiago-doutor":       { name: "🎓 Thiago Doutor",       provider: "anthropic", free: false },
  "thiago-especialista": { name: "🔬 Thiago Especialista", provider: "anthropic", free: false },
  "thiago-supremo":      { name: "👑 Thiago Supremo",      provider: "anthropic", free: false },
}
// --- BASE DE CONHECIMENTO ---
export const uploadKnowledge = async (file) => {
  const formData = new FormData();
  formData.append("pdf", file);
  const response = await fetch("https://hermes.olloapp.com.br/api/upload/pdf", {
    method: "POST",
    body: formData
  });
  if (!response.ok) throw new Error("Erro ao fazer upload");
  return await response.json();
};

export const listKnowledge = async () => {
  const response = await fetch("https://hermes.olloapp.com.br/api/knowledge", { method: "GET" });
  if (!response.ok) throw new Error("Erro ao listar");
  return await response.json();
};

export const deleteKnowledge = async (id) => {
  const response = await fetch("https://hermes.olloapp.com.br/api/knowledge/" + id, { method: "DELETE" });
  if (!response.ok) throw new Error("Erro ao deletar");
  return await response.json();
};

export const clearKnowledge = async () => {
  const response = await fetch("https://hermes.olloapp.com.br/api/knowledge", { method: "DELETE" });
  if (!response.ok) throw new Error("Erro ao limpar");
  return await response.json();
};