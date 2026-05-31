import { useState, useRef, useCallback } from 'react'
import {
  createConversation,
  saveMessages,
  finishConversation,
  getConversations,
  getConversation,
} from '../services/firestoreService'

const INACTIVITY_LIMIT = 60 * 60 * 1000

// ✅ Gera título descritivo removendo prefixos comuns
const generateTitle = (messages) => {
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (!firstUserMsg) return 'Nova conversa'
  const content = firstUserMsg.content.trim()
  const cleaned = content
    .replace(/^(me explica|me explique|o que é|o que são|como funciona|como fazer|qual é|quais são|fale sobre|explica|explique|define|definição de|me fala sobre|me diz|quero saber)\s+/i, '')
    .trim()
  const titled = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return titled.length > 45 ? titled.slice(0, 45) + '...' : titled
}

const useConversation = (userId) => {
  const [conversationId, setConversationId] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const inactivityTimer = useRef(null)
  const currentMessages = useRef([])
  const conversationIdRef = useRef(null)

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

  const removeConversation = useCallback((id) => {
    setConversations(prev => prev.filter(c => c.id !== id))
  }, [])

  // ✅ Inicia nova conversa
  const startNewConversation = useCallback(async () => {
    if (!userId) return null
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    const id = await createConversation(userId)
    setConversationId(id)
    conversationIdRef.current = id
    currentMessages.current = []
    // ✅ Salva no localStorage para retomar ao recarregar
    localStorage.setItem('hermes-conv-id', id)
    return id
  }, [userId])

  // ✅ Tenta retomar conversa salva ao carregar
  const resumeSavedConversation = useCallback(async () => {
    if (!userId) return null
    const savedId = localStorage.getItem('hermes-conv-id')
    if (!savedId) return null
    try {
      const conv = await getConversation(userId, savedId)
      if (conv && conv.messages?.length > 0) {
        setConversationId(savedId)
        conversationIdRef.current = savedId
        currentMessages.current = conv.messages // ✅ CARREGA as mensagens da conversa salva
        return conv
      } else {
        // Se a conversa salva não existe mais, remove do localStorage
        localStorage.removeItem('hermes-conv-id')
      }
    } catch (error) {
      console.error('Erro ao retomar conversa:', error)
      localStorage.removeItem('hermes-conv-id')
    }
    return null
  }, [userId])

  // ✅ Salva mensagens
  const onMessagesUpdate = useCallback(async (messages) => {
    if (!userId) return
    let id = conversationIdRef.current
    if (!id) {
      id = await createConversation(userId)
      setConversationId(id)
      conversationIdRef.current = id
      localStorage.setItem('hermes-conv-id', id)
    }
    currentMessages.current = messages
    await saveMessages(userId, id, messages)
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(async () => {
      const title = generateTitle(currentMessages.current)
      await finishConversation(userId, id, title)
      await startNewConversation()
      await loadHistory()
    }, INACTIVITY_LIMIT)
  }, [userId, startNewConversation, loadHistory])

  // ✅ Finaliza conversa atual e inicia nova
  const finishAndStartNew = useCallback(async (messages) => {
    if (!userId) return
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    const id = conversationIdRef.current
    if (id && messages && messages.some(m => m.role === 'user')) {
      const title = generateTitle(messages)
      await finishConversation(userId, id, title)
    }
    localStorage.removeItem('hermes-conv-id')
    await startNewConversation()
    await loadHistory()
  }, [userId, startNewConversation, loadHistory])

  // ✅ Resgata conversa do histórico
  const resumeConversation = useCallback(async (id) => {
    if (!userId || !id) return null
    
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    
    try {
      const conv = await getConversation(userId, id)
      if (conv && conv.messages?.length > 0) {
        setConversationId(id)
        conversationIdRef.current = id
        currentMessages.current = conv.messages // ✅ CARREGA as mensagens
        localStorage.setItem('hermes-conv-id', id)
        return conv.messages
      }
    } catch (error) {
      console.error('Erro ao resgatar conversa:', error)
    }
    return null
  }, [userId])

  const initConversation = useCallback(async () => {
    if (!userId) return
    await startNewConversation()
  }, [userId, startNewConversation])

  return {
    conversationId,
    conversations,
    loadingHistory,
    onMessagesUpdate,
    finishAndStartNew,
    resumeConversation,
    resumeSavedConversation,
    loadHistory,
    startNewConversation,
    removeConversation,
    initConversation,
  }
}

export default useConversation


