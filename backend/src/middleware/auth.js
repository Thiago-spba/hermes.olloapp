import admin from "firebase-admin"

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido ou inválido." })
    }

    const token = authHeader.split("Bearer ")?.trim()
    if (!token) {
      return res.status(401).json({ error: "Token ausente." })
    }

    const decoded = await admin.auth().verifyIdToken(token)
    
    // Popula tanto 'id' quanto 'uid' para máxima compatibilidade
    req.user = { 
      id: decoded.uid, 
      uid: decoded.uid, 
      email: decoded.email 
    }

    next()
  } catch (err) {
    console.warn("⚠️ Falha na validação do token Firebase:", err.message)
    return res.status(401).json({ error: "Sessão expirada ou token inválido. Faça login novamente." })
  }
}

export default auth