import { useState, useEffect, useRef } from "react";
import {
  saveProject,
  getProjects,
  deleteProject,
} from "../services/firestoreService";
import { extractPdfText } from "../services/api";

const INFO_CARD_KEY = "hermes-projects-info-dismissed";

const ProjectsModal = ({ isDark, onClose, onSelectProject, userId }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    context: "",
    pdfText: "",
    pdfName: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef(null);
  const infoTimerRef = useRef(null);

  const c = {
    bg: isDark ? "#071a14" : "#f0faf7",
    card: isDark ? "#0d2e1f" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    input: isDark ? "#0a2218" : "#f5faf8",
  };

  useEffect(() => {
    const dismissed = localStorage.getItem(INFO_CARD_KEY);
    if (!dismissed) setShowInfo(true);
  }, []);

  useEffect(() => {
    if (showInfo) {
      infoTimerRef.current = setTimeout(() => setShowInfo(false), 12000);
      return () => clearTimeout(infoTimerRef.current);
    }
  }, [showInfo]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      try {
        const list = await getProjects(userId);
        setProjects(list);
      } catch {
        // fallback localStorage
        const saved = localStorage.getItem("hermes-projects");
        if (saved) setProjects(JSON.parse(saved));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleDismissInfo = () => {
    clearTimeout(infoTimerRef.current);
    setShowInfo(false);
    localStorage.setItem(INFO_CARD_KEY, "1");
  };

  const handlePdfUpload = async (file) => {
    if (!file || file.type !== "application/pdf") return;
    setPdfLoading(true);
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = (e) => res(e.target.result);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const b64 = base64.includes(",") ? base64.split(",")[1] : base64;
      const byteChars = atob(b64);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++)
        byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: "application/pdf" });
      const pdfFile = new File([blob], file.name, { type: "application/pdf" });
      const text = await extractPdfText(pdfFile);
      setForm((f) => ({ ...f, pdfText: text, pdfName: file.name }));
    } catch {
      alert("Erro ao extrair o PDF. Tente novamente.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    try {
      const projectData = {
        name: form.name,
        description: form.description,
        context: form.context,
        pdfText: form.pdfText || "",
        pdfName: form.pdfName || "",
        ...(editing ? { id: editing } : {}),
      };
      const id = await saveProject(userId, projectData);
      const saved = { ...projectData, id };
      setProjects((prev) =>
        editing
          ? prev.map((p) => (p.id === editing ? saved : p))
          : [saved, ...prev],
      );
      setEditing(null);
      setForm({
        name: "",
        description: "",
        context: "",
        pdfText: "",
        pdfName: "",
      });
      setShowForm(false);
    } catch {
      alert("Erro ao salvar projeto. Tente novamente.");
    }
  };

  const handleEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description || "",
      context: p.context || "",
      pdfText: p.pdfText || "",
      pdfName: p.pdfName || "",
    });
    setEditing(p.id);
    setShowForm(true);
  };

  const handleDelete = async (p) => {
    if (!confirm(`Deletar projeto "${p.name}"?`)) return;
    try {
      await deleteProject(userId, p.id);
      setProjects((prev) => prev.filter((x) => x.id !== p.id));
    } catch {
      alert("Erro ao deletar.");
    }
  };

  const handleSelect = (p) => {
    const context = [
      p.description,
      p.context,
      p.pdfText
        ? `Conteúdo do documento "${p.pdfName}":\n${p.pdfText.substring(0, 3000)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    onSelectProject({ ...p, context });
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          backgroundColor: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: "16px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>📁</span>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: isDark ? "#00e5ff" : "#0099bb",
              }}
            >
              Meus Projetos
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "18px",
              color: c.sub,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {/* Card informativo */}
          {showInfo && (
            <div
              style={{
                backgroundColor: isDark
                  ? "rgba(0,229,255,0.08)"
                  : "rgba(0,200,150,0.08)",
                border: `1px solid ${isDark ? "#00e5ff44" : "#00c89644"}`,
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "16px",
                position: "relative",
              }}
            >
              <button
                onClick={handleDismissInfo}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "12px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: c.sub,
                }}
              >
                ✕
              </button>
              <div style={{ fontSize: "16px", marginBottom: "6px" }}>
                📁 O que são Meus Projetos?
              </div>
              <p
                style={{
                  fontSize: "12px",
                  color: c.sub,
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                Cadastre seus projetos aqui para que o Hermes tenha contexto
                completo sobre eles. Adicione uma descrição, detalhes técnicos
                ou até um PDF com a documentação. Ao selecionar um projeto, o
                Hermes já começa a conversa sabendo tudo sobre ele.
              </p>
              <div
                style={{
                  fontSize: "10px",
                  color: c.sub,
                  marginTop: "8px",
                  opacity: 0.6,
                }}
              >
                Fecha automaticamente em 6 segundos
              </div>
            </div>
          )}

          {/* Lista vazia */}
          {!loading && projects.length === 0 && !showForm && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: c.sub,
              }}
            >
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📂</div>
              <p style={{ fontSize: "14px" }}>Nenhum projeto cadastrado.</p>
              <p style={{ fontSize: "12px" }}>
                Adicione seus projetos para o Hermes ter contexto sobre eles.
              </p>
            </div>
          )}

          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: c.sub,
                fontSize: "13px",
              }}
            >
              Carregando projetos...
            </div>
          )}

          {/* Lista de projetos */}
          {projects.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: c.card,
                border: `1px solid ${c.border}`,
                borderRadius: "12px",
                padding: "14px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: c.text,
                  marginBottom: "4px",
                }}
              >
                {p.name}
              </div>
              {p.description && (
                <div
                  style={{
                    fontSize: "12px",
                    color: c.sub,
                    marginBottom: "6px",
                  }}
                >
                  {p.description}
                </div>
              )}
              {p.pdfName && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: isDark ? "#ff6b6b" : "#cc2222",
                    backgroundColor: isDark
                      ? "rgba(255,0,0,0.08)"
                      : "rgba(255,0,0,0.05)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    marginBottom: "6px",
                    width: "fit-content",
                  }}
                >
                  <span>📄</span>
                  <span>{p.pdfName}</span>
                </div>
              )}
              {p.context && (
                <div
                  style={{
                    fontSize: "11px",
                    color: c.sub,
                    backgroundColor: isDark ? "#071a14" : "#e8f5f0",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    maxHeight: "60px",
                    overflow: "hidden",
                  }}
                >
                  {p.context.substring(0, 150)}...
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                <button
                  onClick={() => handleSelect(p)}
                  style={{
                    flex: 1,
                    padding: "6px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    backgroundColor: "#00e5ff",
                    border: "none",
                    cursor: "pointer",
                    color: "#071a14",
                    fontWeight: "700",
                  }}
                >
                  Conversar sobre este projeto
                </button>
                <button
                  onClick={() => handleEdit(p)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    backgroundColor: "transparent",
                    border: `1px solid ${c.border}`,
                    cursor: "pointer",
                    color: c.sub,
                  }}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    backgroundColor: "transparent",
                    border: `1px solid ${c.border}`,
                    cursor: "pointer",
                    color: "#ff4455",
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}

          {/* Formulário */}
          {showForm && (
            <div
              style={{
                backgroundColor: c.card,
                border: `1px solid ${c.border}`,
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "700",
                  color: isDark ? "#00e5ff" : "#0099bb",
                  marginBottom: "12px",
                }}
              >
                {editing ? "Editar Projeto" : "Novo Projeto"}
              </div>

              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome do projeto *"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginBottom: "8px",
                  backgroundColor: c.input,
                  border: `1px solid ${c.border}`,
                  borderRadius: "8px",
                  color: c.text,
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Descrição breve (opcional)"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginBottom: "8px",
                  backgroundColor: c.input,
                  border: `1px solid ${c.border}`,
                  borderRadius: "8px",
                  color: c.text,
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              <textarea
                value={form.context}
                onChange={(e) => setForm({ ...form, context: e.target.value })}
                placeholder="Contexto do projeto — cole aqui detalhes, tecnologias, objetivos..."
                rows={4}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginBottom: "8px",
                  backgroundColor: c.input,
                  border: `1px solid ${c.border}`,
                  borderRadius: "8px",
                  color: c.text,
                  fontSize: "13px",
                  outline: "none",
                  resize: "vertical",
                  boxSizing: "border-box",
                  fontFamily: "inherit",
                }}
              />

              {/* Upload PDF */}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: "none" }}
                onChange={(e) => handlePdfUpload(e.target.files[0])}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `1px dashed ${form.pdfName ? (isDark ? "#00e5ff" : "#007a55") : c.border}`,
                  borderRadius: "8px",
                  padding: "10px 12px",
                  marginBottom: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: form.pdfName
                    ? isDark
                      ? "rgba(0,229,255,0.06)"
                      : "rgba(0,200,150,0.06)"
                    : "transparent",
                }}
              >
                {pdfLoading ? (
                  <span style={{ fontSize: "12px", color: c.sub }}>
                    Extraindo PDF...
                  </span>
                ) : form.pdfName ? (
                  <>
                    <span style={{ fontSize: "16px" }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: isDark ? "#00e5ff" : "#007a55",
                        }}
                      >
                        {form.pdfName}
                      </div>
                      <div style={{ fontSize: "10px", color: c.sub }}>
                        Texto extraído — clique para trocar
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm((f) => ({ ...f, pdfText: "", pdfName: "" }));
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#ff4455",
                        fontSize: "14px",
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "16px" }}>📄</span>
                    <span style={{ fontSize: "12px", color: c.sub }}>
                      Anexar PDF (apostila, livro, documentação...)
                    </span>
                  </>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={handleSubmit}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    backgroundColor: "#00e5ff",
                    border: "none",
                    cursor: "pointer",
                    color: "#071a14",
                    fontWeight: "700",
                  }}
                >
                  {editing ? "Salvar alterações" : "Adicionar projeto"}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setForm({
                      name: "",
                      description: "",
                      context: "",
                      pdfText: "",
                      pdfName: "",
                    });
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    backgroundColor: "transparent",
                    border: `1px solid ${c.border}`,
                    cursor: "pointer",
                    color: c.sub,
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showForm && (
          <div
            style={{ padding: "12px 16px", borderTop: `1px solid ${c.border}` }}
          >
            <button
              onClick={() => {
                setShowForm(true);
                setEditing(null);
                setForm({
                  name: "",
                  description: "",
                  context: "",
                  pdfText: "",
                  pdfName: "",
                });
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "10px",
                fontSize: "13px",
                backgroundColor: "transparent",
                border: `1px solid ${c.border}`,
                cursor: "pointer",
                color: isDark ? "#00e5ff" : "#0099bb",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>+</span> Novo Projeto
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsModal;

