import admin from "firebase-admin"

// Lista de e-mails autorizados a usar o app, vinda do .env (ALLOWED_EMAILS,
// separados por virgula). Se a variavel nao estiver definida, ninguem e
// bloqueado por aqui -- assim o deploy nao quebra o acesso de quem ja usa
// enquanto a lista nao e configurada.
const allowedEmails = (process.env.ALLOWED_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean)

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token invalido." })
    }
    const token = authHeader.split("Bearer ")[1]
    const decoded = await admin.auth().verifyIdToken(token)

    if (allowedEmails.length && !allowedEmails.includes((decoded.email || "").toLowerCase())) {
      return res.status(403).json({ error: "Este e-mail nao tem acesso ao Hermes." })
    }

    req.user = { id: decoded.uid, email: decoded.email }
    next()
  } catch (err) {
    return res.status(401).json({ error: "Token invalido." })
  }
}

export default auth