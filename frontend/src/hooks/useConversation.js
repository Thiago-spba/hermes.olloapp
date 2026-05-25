import { useState, useEffect, useRef, useCallback } from 'react'
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

  const startNewConversation = useCallback(async () => {
    if (!userId) return
    const id = await createConversation(userId)
    setConversationId(id)
    currentMessages.current = []
    return id
  }, [userId])

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

  useEffect(() => {
    if (userId) startNewConversation()
  }, [userId])

  const onMessagesUpdate = useCallback(async (messages) => {
    if (!userId || !conversationId) return
    currentMessages.current = messages
    await saveMessages(userId, conversationId, messages)
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(async () => {
      const title = generateTitle(currentMessages.current)
      await finishConversation(userId, conversationId, title)
      await startNewConversation()
    }, INACTIVITY_LIMIT)
  }, [userId, conversationId])

  const finishAndStartNew = useCallback(async (messages) => {
    if (!userId || !conversationId) return
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    const title = generateTitle(messages)
    await finishConversation(userId, conversationId, title)
    await startNewConversation()
    await loadHistory()
  }, [userId, conversationId])

  const resumeConversation = useCallback((id) => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    setConversationId(id)
  }, [])

  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
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
    removeConversation,
  }
}

export default useConversation

