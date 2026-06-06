import admin from "firebase-admin"

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token invalido." })
    }
    const token = authHeader.split("Bearer ")[1]
    const decoded = await admin.auth().verifyIdToken(token)
    req.user = { id: decoded.uid, email: decoded.email }
    next()
  } catch (err) {
    return res.status(401).json({ error: "Token invalido." })
  }
}

export default auth