import { db } from './firebase'
import {
  collection, addDoc, setDoc, getDocs,
  doc, query, orderBy, limit, serverTimestamp, deleteDoc, getDoc
} from 'firebase/firestore'

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

export const saveMessages = async (userId, conversationId, messages) => {
  const ref = doc(db, 'conversations', userId, 'chats', conversationId)
  await setDoc(ref, {
    messages: messages.map(m => ({ role: m.role, content: m.content, time: m.time })),
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

export const finishConversation = async (userId, conversationId, title) => {
  const ref = doc(db, 'conversations', userId, 'chats', conversationId)
  await setDoc(ref, { title, finished: true, updatedAt: serverTimestamp() }, { merge: true })
}

export const deleteConversation = async (userId, conversationId) => {
  const ref = doc(db, 'conversations', userId, 'chats', conversationId)
  await deleteDoc(ref)
}

export const getConversations = async (userId) => {
  const q = query(
    collection(db, 'conversations', userId, 'chats'),
    orderBy('updatedAt', 'desc'),
    limit(50)
  )
  const snapshot = await getDocs(q)
  const conversations = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
  return conversations
}

export const getConversation = async (userId, conversationId) => {
  const snapshot = await getDocs(collection(db, 'conversations', userId, 'chats'))
  const found = snapshot.docs.find(d => d.id === conversationId)
  return found ? { id: found.id, ...found.data() } : null
}

// ============ PROJETOS ============

export const saveProject = async (userId, project) => {
  if (project.id) {
    const ref = doc(db, 'projects', userId, 'items', project.id)
    await setDoc(ref, { ...project, updatedAt: serverTimestamp() }, { merge: true })
    return project.id
  } else {
    const ref = await addDoc(collection(db, 'projects', userId, 'items'), {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export const getProjects = async (userId) => {
  const q = query(collection(db, 'projects', userId, 'items'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const deleteProject = async (userId, projectId) => {
  const ref = doc(db, 'projects', userId, 'items', projectId)
  await deleteDoc(ref)
}