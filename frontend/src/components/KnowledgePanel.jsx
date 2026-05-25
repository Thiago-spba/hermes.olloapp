import { useState, useEffect, useRef } from "react";
import {
  uploadKnowledge,
  listKnowledge,
  deleteKnowledge,
  clearKnowledge,
  saveTextKnowledge,
} from "../services/api";

const KnowledgePanel = ({ isDark, onClose }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [tab, setTab] = useState("files");
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [savingText, setSavingText] = useState(false);
  const fileInputRef = useRef(null);

  const c = {
    bg: isDark ? "#071a14" : "#f0faf7",
    panel: isDark ? "#0d2e1f" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    hover: isDark ? "#143d2e" : "#e0f5ef",
    accent: "#00e5ff",
    danger: "#ff4455",
    input: isDark ? "#071a14" : "#f0faf7",
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await listKnowledge();
      setFiles(data.files || []);
    } catch {
      showMessage("Erro ao carregar arquivos.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;
    setUploading(true);
    setMessage(null);
    try {
      const result = await uploadKnowledge(selected);
      const total = result.uploaded?.length || 0;
      const erros = result.errors?.length || 0;
      showMessage(
        erros > 0
          ? `${total} enviado(s), ${erros} com erro.`
          : `${total} arquivo(s) adicionado(s)!`,
        erros > 0 ? "warn" : "ok",
      );
      await fetchFiles();
    } catch {
      showMessage("Erro ao enviar arquivos.", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSaveText = async () => {
    if (!textTitle.trim() || !textContent.trim())
      return showMessage("Preencha o titulo e o texto.", "warn");
    setSavingText(true);
    try {
      await saveTextKnowledge(textTitle.trim(), textContent.trim());
      showMessage("Texto salvo na base!", "ok");
      setTextTitle("");
      setTextContent("");
      setTab("files");
      await fetchFiles();
    } catch {
      showMessage("Erro ao salvar texto.", "error");
    } finally {
      setSavingText(false);
    }
  };

  const handleDelete = async (id, filename) => {
    if (!confirm(`Remover "${filename}" da base?`)) return;
    try {
      await deleteKnowledge(id);
      setFiles((prev) => prev.filter((f) => f.id !== id));
      showMessage("Removido.", "ok");
    } catch {
      showMessage("Erro ao remover.", "error");
    }
  };

  const handleClear = async () => {
    if (!confirm("Limpar toda a base de conhecimento?")) return;
    try {
      await clearKnowledge();
      setFiles([]);
      showMessage("Base limpa.", "ok");
    } catch {
      showMessage("Erro ao limpar.", "error");
    }
  };

  const showMessage = (text, type = "ok") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3500);
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        backgroundColor: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "768px",
          backgroundColor: c.panel,
          borderRadius: "20px 20px 0 0",
          border: `1px solid ${c.border}`,
          maxHeight: "85dvh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🧠</span>
            <div>
              <div
                style={{ fontSize: "15px", fontWeight: "700", color: c.text }}
              >
                Base de Conhecimento
              </div>
              <div style={{ fontSize: "11px", color: c.sub }}>
                {files.length} item(s) — PDF, TXT e Texto
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: c.sub,
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${c.border}` }}>
          {[
            ["files", "📂 Arquivos"],
            ["text", "✏️ Digitar texto"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: "12px",
                background: "transparent",
                border: "none",
                borderBottom:
                  tab === key
                    ? `2px solid ${c.accent}`
                    : "2px solid transparent",
                color: tab === key ? c.accent : c.sub,
                fontSize: "13px",
                fontWeight: tab === key ? "700" : "400",
                cursor: "pointer",
                transition: "color 0.2s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {message && (
          <div
            style={{
              margin: "12px 20px 0",
              padding: "10px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              backgroundColor:
                message.type === "ok"
                  ? isDark
                    ? "#0a3d2a"
                    : "#d4f5e9"
                  : message.type === "warn"
                    ? isDark
                      ? "#3d2a0a"
                      : "#fff3cd"
                    : isDark
                      ? "#3d0a0a"
                      : "#fde8e8",
              color:
                message.type === "ok"
                  ? "#00e5aa"
                  : message.type === "warn"
                    ? "#ffaa00"
                    : c.danger,
              border: `1px solid ${message.type === "ok" ? "#00e5aa" : message.type === "warn" ? "#ffaa00" : c.danger}`,
            }}
          >
            {message.text}
          </div>
        )}

        {/* Conteudo */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px" }}>
          {tab === "files" ? (
            loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px",
                  color: c.sub,
                  fontSize: "13px",
                }}
              >
                Carregando...
              </div>
            ) : files.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  color: c.sub,
                  fontSize: "13px",
                }}
              >
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
                Nenhum conteudo na base ainda.
                <br />
                Envie arquivos ou digite um texto.
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    marginBottom: "8px",
                    backgroundColor: c.hover,
                    borderRadius: "10px",
                    border: `1px solid ${c.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>
                      {file.filetype === "pdf" ? "📄" : "📝"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: c.text,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {file.filename}
                      </div>
                      <div style={{ fontSize: "11px", color: c.sub }}>
                        {file.filetype?.toUpperCase()} ·{" "}
                        {formatDate(file.created_at)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(file.id, file.filename)}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: c.danger,
                      fontSize: "16px",
                      padding: "4px 8px",
                      flexShrink: 0,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))
            )
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                paddingTop: "8px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: c.sub,
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Titulo
                </label>
                <input
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                  placeholder=""
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: c.input,
                    border: `1px solid ${c.border}`,
                    borderRadius: "8px",
                    color: c.text,
                    fontSize: "14px",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "12px",
                    color: c.sub,
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Conteudo
                </label>
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Cole ou digite o texto que o Hermes deve conhecer..."
                  rows={8}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: c.input,
                    border: `1px solid ${c.border}`,
                    borderRadius: "8px",
                    color: c.text,
                    fontSize: "13px",
                    lineHeight: "1.6",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div style={{ fontSize: "11px", color: c.sub }}>
                {textContent.length} caracteres · ~
                {Math.ceil(textContent.length / 4)} tokens estimados
              </div>
            </div>
          )}
        </div>

        {/* Acoes */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: `1px solid ${c.border}`,
            display: "flex",
            gap: "10px",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            multiple
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          {tab === "files" ? (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  flex: 1,
                  padding: "12px",
                  backgroundColor: c.accent,
                  border: "none",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#071a14",
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                }}
              >
                {uploading ? "Enviando..." : "＋ Adicionar arquivos"}
              </button>
              {files.length > 0 && (
                <button
                  onClick={handleClear}
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "transparent",
                    border: `1px solid ${c.danger}`,
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: c.danger,
                    cursor: "pointer",
                  }}
                >
                  Limpar tudo
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleSaveText}
              disabled={savingText}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: c.accent,
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: "700",
                color: "#071a14",
                cursor: savingText ? "not-allowed" : "pointer",
                opacity: savingText ? 0.7 : 1,
              }}
            >
              {savingText ? "Salvando..." : "💾 Salvar na base"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgePanel;
