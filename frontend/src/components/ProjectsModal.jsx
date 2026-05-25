import { useState, useEffect } from "react";

const ProjectsModal = ({ isDark, onClose, onSelectProject }) => {
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", context: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hermes-projects");
    if (saved) setProjects(JSON.parse(saved));
  }, []);

  const save = (list) => {
    setProjects(list);
    localStorage.setItem("hermes-projects", JSON.stringify(list));
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    let updated;
    if (editing !== null) {
      updated = projects.map((p, i) => (i === editing ? { ...form } : p));
      setEditing(null);
    } else {
      updated = [...projects, { ...form, id: Date.now() }];
    }
    save(updated);
    setForm({ name: "", description: "", context: "" });
    setShowForm(false);
  };

  const handleEdit = (i) => {
    setForm(projects[i]);
    setEditing(i);
    setShowForm(true);
  };

  const handleDelete = (i) => {
    if (confirm(`Deletar projeto "${projects[i].name}"?`)) {
      save(projects.filter((_, idx) => idx !== i));
    }
  };

  const handleSelect = (p) => {
    onSelectProject(p);
    onClose();
  };

  const c = {
    bg: isDark ? "#071a14" : "#f0faf7",
    card: isDark ? "#0d2e1f" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    hover: isDark ? "#143d2e" : "#e0f5ef",
    input: isDark ? "#0a2218" : "#f5faf8",
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

        {/* Lista de projetos */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
          {projects.length === 0 && !showForm && (
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

          {projects.map((p, i) => (
            <div
              key={p.id || i}
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1 }}>
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
                </div>
              </div>
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
                  onClick={() => handleEdit(i)}
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
                  onClick={() => handleDelete(i)}
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
                {editing !== null ? "Editar Projeto" : "Novo Projeto"}
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
                placeholder="Contexto do projeto — cole aqui detalhes, tecnologias, objetivos, problemas conhecidos..."
                rows={5}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  marginBottom: "12px",
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
                  {editing !== null ? "Salvar alterações" : "Adicionar projeto"}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setForm({ name: "", description: "", context: "" });
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
                setForm({ name: "", description: "", context: "" });
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
