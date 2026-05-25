import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '../../hermes.sqlite')
const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')

export const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pdf_context (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      filename TEXT,
      content TEXT NOT NULL,
      chunks TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, key)
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      filetype TEXT NOT NULL DEFAULT 'pdf',
      content TEXT NOT NULL,
      chunks TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('✅ Banco de dados inicializado.')
}

export const saveMessage = (userId, role, content) => {
  const stmt = db.prepare(`INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)`)
  return stmt.run(userId, role, content)
}

export const getHistory = (userId, limit = 20) => {
  const stmt = db.prepare(`
    SELECT role, content FROM conversations
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `)
  return stmt.all(userId, limit).reverse()
}

export const clearHistory = (userId) => {
  db.prepare(`DELETE FROM conversations WHERE user_id = ?`).run(userId)
}

export const savePdfContext = (userId, filename, content, chunks) => {
  db.prepare(`DELETE FROM pdf_context WHERE user_id = ?`).run(userId)
  const stmt = db.prepare(`INSERT INTO pdf_context (user_id, filename, content, chunks) VALUES (?, ?, ?, ?)`)
  return stmt.run(userId, filename || 'documento.pdf', content, JSON.stringify(chunks))
}

export const getPdfContext = (userId) => {
  const stmt = db.prepare(`
    SELECT filename, content, chunks FROM pdf_context
    WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
  `)
  const row = stmt.get(userId)
  if (!row) return null
  return { filename: row.filename, content: row.content, chunks: JSON.parse(row.chunks) }
}

export const clearPdfContext = (userId) => {
  db.prepare(`DELETE FROM pdf_context WHERE user_id = ?`).run(userId)
}

// ============================================
// Memoria persistente entre conversas
// ============================================

export const saveMemory = (userId, key, value) => {
  const stmt = db.prepare(`
    INSERT INTO user_memory (user_id, key, value, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `)
  return stmt.run(userId, key, value)
}

export const getMemory = (userId) => {
  const stmt = db.prepare(`SELECT key, value FROM user_memory WHERE user_id = ? ORDER BY updated_at DESC`)
  return stmt.all(userId)
}

export const deleteMemory = (userId, key) => {
  db.prepare(`DELETE FROM user_memory WHERE user_id = ? AND key = ?`).run(userId, key)
}

export const clearMemory = (userId) => {
  db.prepare(`DELETE FROM user_memory WHERE user_id = ?`).run(userId)
}

export const getMemoryAsText = (userId) => {
  const memories = getMemory(userId)
  if (!memories.length) return null
  return memories.map(m => `${m.key}: ${m.value}`).join('\n')
}

export const getUserStats = (userId) => {
  const stmt = db.prepare(`
    SELECT COUNT(*) as total_messages, MIN(created_at) as first_message, MAX(created_at) as last_message
    FROM conversations WHERE user_id = ?
  `)
  return stmt.get(userId)
}

// ============================================
// Base de conhecimento (múltiplos arquivos)
// ============================================

export const saveKnowledge = (userId, filename, filetype, content, chunks) => {
  const stmt = db.prepare(`
    INSERT INTO knowledge_base (user_id, filename, filetype, content, chunks)
    VALUES (?, ?, ?, ?, ?)
  `)
  return stmt.run(userId, filename, filetype || 'pdf', content, JSON.stringify(chunks))
}

export const getKnowledgeList = (userId) => {
  const stmt = db.prepare(`
    SELECT id, filename, filetype, created_at FROM knowledge_base
    WHERE user_id = ?
    ORDER BY created_at DESC
  `)
  return stmt.all(userId)
}

export const getKnowledgeChunks = (userId) => {
  const stmt = db.prepare(`
    SELECT id, filename, chunks FROM knowledge_base
    WHERE user_id = ?
    ORDER BY created_at DESC
  `)
  const rows = stmt.all(userId)
  return rows.flatMap(row =>
    JSON.parse(row.chunks).map(chunk => ({
      filename: row.filename,
      text: chunk
    }))
  )
}

export const deleteKnowledge = (userId, id) => {
  db.prepare(`DELETE FROM knowledge_base WHERE id = ? AND user_id = ?`).run(id, userId)
}

export const clearKnowledge = (userId) => {
  db.prepare(`DELETE FROM knowledge_base WHERE user_id = ?`).run(userId)
}

export default db