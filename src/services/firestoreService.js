// ============================================
// HERMES AI — Serviço Firestore
// Salva e busca histórico de conversas
// ============================================

import { db } from './firebase'
import {
  collection, addDoc, updateDoc, getDocs,
  doc, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore'

// ============================================
// Cria nova conversa no Firestore
// ============================================
export const createConversation = async (userId) => {
  const ref = await addDoc(collection(db, 'conversations', userId, 'chats'), {
    title: 'Nova conversa',
    messages: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    finished: false,
  })
  return ref.id
}

// ============================================
// Salva mensagens na conversa ativa
// ============================================
export const saveMessages = async (userId, conversationId, messages) => {
  const ref = doc(db, 'conversations', userId, 'chats', conversationId)
  await updateDoc(ref, {
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      time: m.time,
    })),
    updatedAt: serverTimestamp(),
  })
}

// ============================================
// Finaliza conversa com título gerado pela IA
// ============================================
export const finishConversation = async (userId, conversationId, title) => {
  const ref = doc(db, 'conversations', userId, 'chats', conversationId)
  await updateDoc(ref, {
    title,
    finished: true,
    updatedAt: serverTimestamp(),
  })
}

// ============================================
// Busca histórico de conversas do usuário
// ============================================
export const getConversations = async (userId) => {
  const q = query(
    collection(db, 'conversations', userId, 'chats'),
    orderBy('updatedAt', 'desc'),
    limit(50)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ============================================
// Busca uma conversa específica
// ============================================
export const getConversation = async (userId, conversationId) => {
  const snapshot = await getDocs(
    collection(db, 'conversations', userId, 'chats')
  )
  const found = snapshot.docs.find(d => d.id === conversationId)
  return found ? { id: found.id, ...found.data() } : null
}