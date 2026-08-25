import { useState } from "react";
import { MODELS, API_URL } from "../services/api";

// Agrupa modelos para exibição no seletor
const MODEL_GROUPS = [
  {
    key: "auto",
    label: null, // sem cabeçalho de grupo
    keys: ["auto"],
  },
  {
    key: "or-code",
    label: "🟢 OpenRouter — Código (Gratuito)",
    keys: ["or-qwen3-coder", "or-north-mini", "or-laguna", "or-kimi-k3", "or-gpt-oss"],
  },
  {
    key: "or-general",
    label: "🟢 OpenRouter — Geral (Gratuito)",
    keys: ["or-llama", "or-nemotron", "or-owl"],
  },
  {
    key: "or-paid",
    label: "💰 OpenRouter — Pago",
    keys: ["or-kimi-k27"],
  },
  {
    key: "existing",
    label: "🔵 Seus Provedores",
    keys: ["thiago-analiza", "thiago-jr", "thiago-senior", "thiago-doutor", "thiago-especialista", "thiago-supremo"],
  },
];

const ModelSelector = ({ selectedModel, onModelChange, isDark, paidModelActive }) => {
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const current = MODELS[selectedModel] || MODELS["auto"];

  const c = {
    bg:     isDark ? "#0d2e1f" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text:   isDark ? "#e0f5f0" : "#071a14",
    sub:    isDark ? "#7aada0" : "#2a6b5a",
    hover:  isDark ? "#143d2e" : "#e0f5ef",
    group:  isDark ? "#071a14" : "#f0faf7",
  };

  const handleSelectModel = (key) => {
    if (key === "thiago-supremo") {
      setShowPasswordModal(true);
      setPassword("");
      setPasswordError(false);
      setOpen(false);
    } else {
      onModelChange(key);
      setOpen(false);
    }
  };

  const handlePasswordConfirm = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-supremo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.valid) {
        onModelChange("thiago-supremo");
        setShowPasswordModal(false);
        setPassword("");
        setPasswordError(false);
      } else {
        setPasswordError(true);
        setPassword("");
      }
    } catch {
      setPasswordError(true);
      setPassword("");
    }
  };

  // Badge de status do modelo atual
  const getBadge = (model) => {
    if (!model) return null;
    if (model.provider === "auto") return { label: "AUTO", color: isDark ? "#00e5ff" : "#0099bb", bg: isDark ? "#003344" : "#cceeff" };
    if (!model.free) return { label: "PAGO", color: isDark ? "#a78bfa" : "#6d28d9", bg: isDark ? "#1a1a2e" : "#e8e0ff" };
    return { label: "GRÁTIS", color: isDark ? "#00e5aa" : "#007a55", bg: isDark ? "#143d2e" : "#ccede5" };
  };

  const badge = getBadge(current);

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "4px" }}>

      {/* ── Alerta modelo pago ativo ──────────────────────── */}
      {paidModelActive && (
        <div style={{
          fontSize: "10px",
          padding: "2px 8px",
          borderRadius: "8px",
          backgroundColor: isDark ? "#2d1a00" : "#fff3cd",
          color: isDark ? "#ffaa00" : "#856404",
          border: `1px solid ${isDark ? "#664400" : "#ffc107"}`,
          textAlign: "center",
          fontWeight: "600",
          whiteSpace: "nowrap",
        }}>
          💰 Modelo pago ativo
        </div>
      )}

      {/* ── Botão principal ───────────────────────────────── */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "20px",
          fontSize: "12px",
          backgroundColor: isDark ? "#0d2e1f" : "#e0f5ef",
          border: `1px solid ${paidModelActive ? (isDark ? "#664400" : "#ffc107") : c.border}`,
          cursor: "pointer",
          color: isDark ? "#00e5ff" : "#0099bb",
          fontWeight: "600",
          whiteSpace: "nowrap",
        }}
      >
        <span>{current.name}</span>
        {badge && (
          <span style={{
            fontSize: "8px",
            padding: "1px 5px",
            borderRadius: "8px",
            backgroundColor: badge.bg,
            color: badge.color,
            fontWeight: "700",
          }}>
            {badge.label}
          </span>
        )}
        <span style={{ fontSize: "9px", opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>

      {/* ── Modal senha Supremo ───────────────────────────── */}
      {showPasswordModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500,
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            backgroundColor: isDark ? "#0d2e1f" : "#ffffff",
            border: `1px solid ${isDark ? "#143d2e" : "#b0ddd4"}`,
            borderRadius: "16px", padding: "24px", width: "280px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>👑</div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: isDark ? "#e0f5f0" : "#071a14" }}>
                Thiago Supremo
              </div>
              <div style={{ fontSize: "11px", color: isDark ? "#7aada0" : "#2a6b5a", marginTop: "4px" }}>
                Digite a senha para ativar
              </div>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordConfirm()}
              placeholder="Senha"
              autoFocus
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "8px",
                border: `1px solid ${passwordError ? "#ff4455" : isDark ? "#143d2e" : "#b0ddd4"}`,
                backgroundColor: isDark ? "#071a14" : "#f0faf7",
                color: isDark ? "#e0f5f0" : "#071a14",
                fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "6px",
              }}
            />
            {passwordError && (
              <div style={{ fontSize: "11px", color: "#ff4455", marginBottom: "10px", textAlign: "center" }}>
                Senha incorreta
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                onClick={() => { setShowPasswordModal(false); setPassword(""); setPasswordError(false); }}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  backgroundColor: "transparent",
                  border: `1px solid ${isDark ? "#143d2e" : "#b0ddd4"}`,
                  color: isDark ? "#7aada0" : "#2a6b5a", cursor: "pointer", fontSize: "13px",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handlePasswordConfirm}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  backgroundColor: "#00e5ff", border: "none",
                  color: "#071a14", fontWeight: "700", cursor: "pointer", fontSize: "13px",
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dropdown principal ────────────────────────────── */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
          <div style={{
            position: "absolute",
            bottom: paidModelActive ? "72px" : "36px",
            left: 0,
            zIndex: 200,
            backgroundColor: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: "12px",
            minWidth: "240px",
            maxHeight: "420px",
            overflowY: "auto",
            boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.6)" : "0 8px 32px rgba(0,0,0,0.15)",
          }}>

            {/* Cabeçalho */}
            <div style={{
              padding: "8px 12px",
              fontSize: "10px", color: c.sub,
              borderBottom: `1px solid ${c.border}`,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
            }}>
              Selecionar modelo
            </div>

            {/* Grupos de modelos */}
            {MODEL_GROUPS.map((group) => (
              <div key={group.key}>
                {/* Label do grupo */}
                {group.label && (
                  <div style={{
                    padding: "6px 12px",
                    fontSize: "9px",
                    color: c.sub,
                    backgroundColor: c.group,
                    borderBottom: `1px solid ${c.border}`,
                    fontWeight: "700",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}>
                    {group.label}
                  </div>
                )}

                {/* Modelos do grupo */}
                {group.keys.map((key) => {
                  const model = MODELS[key];
                  if (!model) return null;
                  const isSelected = selectedModel === key;
                  const modelBadge = getBadge(model);

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelectModel(key)}
                      style={{
                        width: "100%",
                        padding: "9px 14px",
                        backgroundColor: isSelected
                          ? (isDark ? "#0a2218" : "#e0f5ef")
                          : "transparent",
                        border: "none",
                        borderBottom: `1px solid ${c.border}`,
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: "12px",
                        color: isSelected ? (isDark ? "#00e5ff" : "#0099bb") : c.text,
                        fontWeight: isSelected ? "700" : "400",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = c.hover)}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isSelected ? (isDark ? "#0a2218" : "#e0f5ef") : "transparent")}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                        <span>
                          {model.name}
                          {key === "thiago-supremo" ? " 🔒" : ""}
                        </span>
                        {model.description && (
                          <span style={{ fontSize: "9px", color: c.sub, fontWeight: "400" }}>
                            {model.description}
                          </span>
                        )}
                      </div>
                      {modelBadge && (
                        <span style={{
                          fontSize: "8px",
                          padding: "2px 5px",
                          borderRadius: "8px",
                          backgroundColor: modelBadge.bg,
                          color: modelBadge.color,
                          fontWeight: "700",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}>
                          {modelBadge.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelSelector;
