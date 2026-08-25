import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../../hermes.sqlite')
const db = new Database(dbPath)

// Configuração para alta performance e concorrência
db.pragma('journal_mode = WAL')

export const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      filetype TEXT NOT NULL,
      content TEXT,
      chunks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, key)
    );
  `)
}

// Histórico de Mensagens
export const saveMessage = (userId, role, content) => {
  try {
    const stmt = db.prepare('INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)')
    return stmt.run(userId || 'default_user', role, content || '')
  } catch (err) {
    console.error('Erro ao salvar mensagem:', err.message)
  }
}

export const getHistory = (userId, limit = 50) => {
  try {
    const stmt = db.prepare('SELECT role, content, created_at FROM messages WHERE user_id = ? ORDER BY id DESC LIMIT ?')
    const rows = stmt.all(userId || 'default_user', limit)
    return rows.reverse()
  } catch (err) {
    console.error('Erro ao buscar histórico:', err.message)
    return []
  }
}

export const clearHistory = (userId) => {
  try {
    const stmt = db.prepare('DELETE FROM messages WHERE user_id = ?')
    return stmt.run(userId || 'default_user')
  } catch (err) {
    console.error('Erro ao limpar histórico:', err.message)
  }
}

// Base de Conhecimento
export const saveKnowledge = (userId, filename, filetype, content, chunks) => {
  try {
    const chunksJson = typeof chunks === 'string' ? chunks : JSON.stringify(chunks || [])
    const stmt = db.prepare('INSERT INTO knowledge_base (user_id, filename, filetype, content, chunks) VALUES (?, ?, ?, ?, ?)')
    return stmt.run(userId || 'default_user', filename, filetype, content || '', chunksJson)
  } catch (err) {
    console.error('Erro ao salvar conhecimento:', err.message)
  }
}

export const getKnowledgeList = (userId) => {
  try {
    const stmt = db.prepare('SELECT id, filename, filetype, created_at FROM knowledge_base WHERE user_id = ? ORDER BY id DESC')
    return stmt.all(userId || 'default_user')
  } catch (err) {
    console.error('Erro ao listar conhecimento:', err.message)
    return []
  }
}

export const getKnowledgeChunks = (userId) => {
  try {
    const stmt = db.prepare('SELECT id, filename, chunks FROM knowledge_base WHERE user_id = ?')
    const rows = stmt.all(userId || 'default_user')
    const allChunks = []
    for (const row of rows) {
      if (row.chunks) {
        try {
          const parsed = JSON.parse(row.chunks)
          if (Array.isArray(parsed)) {
            parsed.forEach((chunk, index) => {
              allChunks.push({
                id: `${row.id}_${index}`,
                filename: row.filename,
                text: typeof chunk === 'string' ? chunk : JSON.stringify(chunk)
              })
            })
          }
        } catch {
          allChunks.push({ id: `${row.id}_0`, filename: row.filename, text: row.chunks })
        }
      }
    }
    return allChunks
  } catch (err) {
    console.error('Erro ao buscar chunks de conhecimento:', err.message)
    return []
  }
}

export const deleteKnowledge = (userId, id) => {
  try {
    const stmt = db.prepare('DELETE FROM knowledge_base WHERE id = ? AND user_id = ?')
    return stmt.run(id, userId || 'default_user')
  } catch (err) {
    console.error('Erro ao deletar conhecimento:', err.message)
  }
}

export const clearKnowledge = (userId) => {
  try {
    const stmt = db.prepare('DELETE FROM knowledge_base WHERE user_id = ?')
    return stmt.run(userId || 'default_user')
  } catch (err) {
    console.error('Erro ao limpar base de conhecimento:', err.message)
  }
}

// Memória Persistente do Usuário
export const saveMemory = (userId, key, value) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO user_memory (user_id, key, value, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `)
    return stmt.run(userId || 'default_user', key, value)
  } catch (err) {
    console.error('Erro ao salvar memória:', err.message)
  }
}

export const getMemory = (userId) => {
  try {
    const stmt = db.prepare('SELECT key, value, updated_at FROM user_memory WHERE user_id = ?')
    return stmt.all(userId || 'default_user')
  } catch (err) {
    console.error('Erro ao buscar memórias:', err.message)
    return []
  }
}

export const getMemoryAsText = (userId) => {
  try {
    const memories = getMemory(userId)
    if (!memories || memories.length === 0) return ''
    return memories.map(m => `- ${m.key}: ${m.value}`).join('\n')
  } catch (err) {
    console.error('Erro ao formatar memória como texto:', err.message)
    return ''
  }
}

export { db }
export default db