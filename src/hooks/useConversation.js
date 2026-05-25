import { useState, useRef, useCallback } from 'react'
import {
  createConversation,
  saveMessages,
  finishConversation,
  getConversations,
} from '../services/firestoreService'

const INACTIVITY_LIMIT = 60 * 60 * 1000

const generateTitle = (messages) => {
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (!firstUserMsg) return 'Nova conversa'
  const content = firstUserMsg.content.trim()
  if (content.length <= 40) return content
  return content.substring(0, 40) + '...'
}

const useConversation = (userId) => {
  const [conversationId, setConversationId] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const inactivityTimer = useRef(null)
  const currentMessages = useRef([])
  const hasMessages = useRef(false)

  // Inicia nova conversa — só cria no Firestore quando houver mensagem
  const startNewConversation = useCallback(() => {
    setConversationId(null)
    currentMessages.current = []
    hasMessages.current = false
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
  }, [])

  // Cria conversa no Firestore e salva mensagens
  const ensureConversation = useCallback(async (messages) => {
    if (!userId) return null
    let id = conversationId
    if (!id) {
      id = await createConversation(userId)
      setConversationId(id)
    }
    return id
  }, [userId, conversationId])

  // Carrega histórico
  const loadHistory = useCallback(async () => {
    if (!userId) return
    setLoadingHistory(true)
    try {
      const list = await getConversations(userId)
      setConversations(list)
    } finally {
      setLoadingHistory(false)
    }
  }, [userId])

  // Salva mensagens — só cria conversa se houver mensagem real
  const onMessagesUpdate = useCallback(async (messages) => {
    if (!userId) return
    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length === 0) return // não salva se não houver mensagem do usuário

    currentMessages.current = messages
    hasMessages.current = true

    const id = await ensureConversation(messages)
    if (!id) return

    await saveMessages(userId, id, messages)

    // Timer de inatividade — 1 hora
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(async () => {
      const title = generateTitle(currentMessages.current)
      await finishConversation(userId, id, title)
      startNewConversation()
      await loadHistory()
    }, INACTIVITY_LIMIT)
  }, [userId, ensureConversation, startNewConversation, loadHistory])

  // Finaliza conversa manualmente e inicia nova
  const finishAndStartNew = useCallback(async (messages) => {
    if (!userId) return
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)

    const userMessages = messages.filter(m => m.role === 'user')
    if (userMessages.length > 0 && conversationId) {
      const title = generateTitle(messages)
      await finishConversation(userId, conversationId, title)
      await loadHistory()
    }

    startNewConversation()
  }, [userId, conversationId, startNewConversation, loadHistory])

  // Retoma conversa do histórico
  const resumeConversation = useCallback((id) => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    setConversationId(id)
    hasMessages.current = true
  }, [])

  return {
    conversationId,
    conversations,
    loadingHistory,
    onMessagesUpdate,
    finishAndStartNew,
    resumeConversation,
    loadHistory,
    startNewConversation,
  }
}

export default useConversation