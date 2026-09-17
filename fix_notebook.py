file_path = r"C:\hermes-ai-agent\frontend\src\components\NotebookPanel.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Estados fontSize e isMobile
old = '  const [novaTagInput, setNovaTagInput] = useState("");'
new = '''  const [novaTagInput, setNovaTagInput] = useState("");
  const [fontSize, setFontSize] = useState(14);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);'''
content = content.replace(old, new, 1)

# 2. Container responsivo
old = '          width: "95%",\n          maxWidth: 900,\n          height: "85vh",\n          borderRadius: 12,'
new = '          width: isMobile ? "100%" : "95%",\n          maxWidth: 900,\n          height: isMobile ? "100dvh" : "85vh",\n          borderRadius: isMobile ? 0 : 12,'
content = content.replace(old, new, 1)

# 3. Lista responsiva
old = '            width: 280,\n            borderRight: `1px solid ${c.border}`,\n            display: "flex",\n            flexDirection: "column",'
new = '            width: isMobile ? "100%" : 280,\n            borderRight: `1px solid ${c.border}`,\n            display: isMobile && selecionada ? "none" : "flex",\n            flexDirection: "column",'
content = content.replace(old, new, 1)

# 4. Editor responsivo com botao voltar
old = '        {/* EDITOR */}\n        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>\n          {!selecionada ? ('
new = '''        {/* EDITOR */}
        <div style={{ flex: 1, display: isMobile && !selecionada ? "none" : "flex", flexDirection: "column" }}>
          {isMobile && selecionada && (
            <button
              onClick={() => setSelecionada(null)}
              style={{
                padding: "10px 14px",
                background: "none",
                border: "none",
                borderBottom: `1px solid ${c.border}`,
                color: c.sub,
                cursor: "pointer",
                textAlign: "left",
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              \u2190 Voltar \u00e0s notas
            </button>
          )}
          {!selecionada ? ('''
content = content.replace(old, new, 1)

# 5. Botoes A+ e A-
old = '                <button\n                  onClick={() => excluirNota(selecionada)}'
new = '''                <button
                  onClick={() => setFontSize(s => Math.min(s + 2, 26))}
                  style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${c.border}`, background: c.card, color: c.text, cursor: "pointer", fontWeight: 700, fontSize: 15 }}
                  title="Aumentar fonte"
                >A+</button>
                <button
                  onClick={() => setFontSize(s => Math.max(s - 2, 10))}
                  style={{ padding: "6px 10px", borderRadius: 6, border: `1px solid ${c.border}`, background: c.card, color: c.text, cursor: "pointer", fontWeight: 700, fontSize: 12 }}
                  title="Diminuir fonte"
                >A-</button>
                <button
                  onClick={() => excluirNota(selecionada)}'''
content = content.replace(old, new, 1)

# 6. fontSize dinamico no textarea
old = '                  fontSize: 14,\n                  fontFamily: "inherit",'
new = '                  fontSize: fontSize,\n                  fontFamily: "inherit",\n                  lineHeight: 1.6,'
content = content.replace(old, new, 1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("OK")
