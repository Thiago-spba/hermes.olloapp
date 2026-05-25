import app from "./src/app.js"

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log("✅ Banco de dados inicializado.")
  console.log(`✅ Hermes API rodando na porta ${PORT}`)
})