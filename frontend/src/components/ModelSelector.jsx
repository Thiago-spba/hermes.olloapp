import { useState } from "react";
import { MODELS, API_URL } from "../services/api";


const ModelSelector = ({ selectedModel, onModelChange, isDark }) => {
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const current = MODELS[selectedModel] || MODELS["thiago-doutor"];

  const c = {
    bg: isDark ? "#0d2e1f" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    hover: isDark ? "#143d2e" : "#e0f5ef",
  };

  const handleSelectModel = (key) => {
    if (key === "thiago-supremo") {
      setShowPasswordModal(true);
      setPassword("");
      setPasswordError(false);
      setShowPassword(false);
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
        setShowPassword(false);
      } else {
        setPasswordError(true);
        setPassword("");
      }
    } catch (err) {
      setPasswordError(true);
      setPassword("");
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Modal de senha */}
      {showPasswordModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: isDark ? "#0d2e1f" : "#ffffff",
              border: `1px solid ${isDark ? "#143d2e" : "#b0ddd4"}`,
              borderRadius: "16px",
              padding: "24px",
              width: "280px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>👑</div>
              <div
                style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  color: isDark ? "#e0f5f0" : "#071a14",
                }}
              >
                Thiago Supremo
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: isDark ? "#7aada0" : "#2a6b5a",
                  marginTop: "4px",
                }}
              >
                Digite a senha para ativar
              </div>
            </div>
            <div style={{ position: "relative", marginBottom: "6px" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordConfirm()}
                placeholder="Senha"
                autoFocus
                style={{
                  width: "100%",
                  padding: "10px 36px 10px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${passwordError ? "#ff4455" : isDark ? "#143d2e" : "#b0ddd4"}`,
                  backgroundColor: isDark ? "#071a14" : "#f0faf7",
                  color: isDark ? "#e0f5f0" : "#071a14",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                style={{
                  position: "absolute",
                  right: "8px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "15px",
                  padding: "4px",
                  lineHeight: 1,
                  color: isDark ? "#7aada0" : "#2a6b5a",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {passwordError && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#ff4455",
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                Senha incorreta
              </div>
            )}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword("");
                  setPasswordError(false);
                  setShowPassword(false);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "transparent",
                  border: `1px solid ${isDark ? "#143d2e" : "#b0ddd4"}`,
                  color: isDark ? "#7aada0" : "#2a6b5a",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handlePasswordConfirm}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "#00e5ff",
                  border: "none",
                  color: "#071a14",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

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
          border: `1px solid ${c.border}`,
          cursor: "pointer",
          color: isDark ? "#00e5ff" : "#0099bb",
          fontWeight: "600",
          whiteSpace: "nowrap",
        }}
      >
        <span>{current.name}</span>
        <span style={{ fontSize: "9px", opacity: 0.7 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 98 }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "36px",
              left: 0,
              zIndex: 200,
              backgroundColor: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: "12px",
              minWidth: "200px",
              overflow: "hidden",
              boxShadow: isDark
                ? "0 8px 32px rgba(0,0,0,0.6)"
                : "0 8px 32px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                padding: "8px 12px",
                fontSize: "10px",
                color: c.sub,
                borderBottom: `1px solid ${c.border}`,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Selecionar modelo
            </div>

            {Object.entries(MODELS).map(([key, model]) => (
              <button
                key={key}
                onClick={() => handleSelectModel(key)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  backgroundColor:
                    selectedModel === key
                      ? isDark
                        ? "#0a2218"
                        : "#e0f5ef"
                      : "transparent",
                  border: "none",
                  borderBottom: `1px solid ${c.border}`,
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "13px",
                  color:
                    selectedModel === key
                      ? isDark
                        ? "#00e5ff"
                        : "#0099bb"
                      : c.text,
                  fontWeight: selectedModel === key ? "700" : "400",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = c.hover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    selectedModel === key
                      ? isDark
                        ? "#0a2218"
                        : "#e0f5ef"
                      : "transparent")
                }
              >
                <span>
                  {model.name}
                  {key === "thiago-supremo" ? " 🔒" : ""}
                </span>
                <span
                  style={{
                    fontSize: "9px",
                    padding: "2px 6px",
                    borderRadius: "10px",
                    backgroundColor: model.free
                      ? isDark
                        ? "#143d2e"
                        : "#ccede5"
                      : isDark
                        ? "#1a1a2e"
                        : "#e8e0ff",
                    color: model.free
                      ? isDark
                        ? "#00e5aa"
                        : "#007a55"
                      : isDark
                        ? "#a78bfa"
                        : "#6d28d9",
                    fontWeight: "700",
                  }}
                >
                  {model.free ? "GRÁTIS" : "PREMIUM"}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ModelSelector;
