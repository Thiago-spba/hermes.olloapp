import { db } from './firebase'
import {
  collection, addDoc, setDoc, getDocs,
  doc, query, orderBy, serverTimestamp, deleteDoc
} from 'firebase/firestore'

// ============ NOTAS ============

export const getNotas = async (userId) => {
  const q = query(collection(db, 'notas', userId, 'items'), orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}

export const saveNota = async (userId, nota) => {
  if (nota.id) {
    const ref = doc(db, 'notas', userId, 'items', nota.id)
    await setDoc(ref, {
      titulo: nota.titulo,
      conteudo: nota.conteudo,
      tags: nota.tags || [],
      fixada: nota.fixada || false,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    return nota.id
  } else {
    const ref = await addDoc(collection(db, 'notas', userId, 'items'), {
      titulo: nota.titulo || 'Sem título',
      conteudo: nota.conteudo || '',
      tags: nota.tags || [],
      fixada: nota.fixada || false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }
}

export const deleteNota = async (userId, notaId) => {
  const ref = doc(db, 'notas', userId, 'items', notaId)
  await deleteDoc(ref)
}

export const toggleFixarNota = async (userId, notaId, fixada) => {
  const ref = doc(db, 'notas', userId, 'items', notaId)
  await setDoc(ref, { fixada, updatedAt: serverTimestamp() }, { merge: true })
}

// ============ VERSÕES (HISTÓRICO) ============

export const salvarVersao = async (userId, notaId, conteudoAnterior, tituloAnterior) => {
  await addDoc(collection(db, 'notas', userId, 'items', notaId, 'versoes'), {
    conteudo: conteudoAnterior,
    titulo: tituloAnterior,
    criadoEm: serverTimestamp(),
  })
}

export const getVersoes = async (userId, notaId) => {
  const q = query(
    collection(db, 'notas', userId, 'items', notaId, 'versoes'),
    orderBy('criadoEm', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
}