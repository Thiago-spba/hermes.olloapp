import { useState } from "react";
import { MODELS } from "../services/api";

const ModelSelector = ({ selectedModel, onModelChange, isDark }) => {
  const [open, setOpen] = useState(false);

  const current = MODELS[selectedModel] || MODELS["thiago-senior"];

  const c = {
    bg: isDark ? "#0d2e1f" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    hover: isDark ? "#143d2e" : "#e0f5ef",
  };

  return (
    <div style={{ position: "relative" }}>
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
                onClick={() => {
                  onModelChange(key);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  backgroundColor: "transparent",
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
                  backgroundColor:
                    selectedModel === key
                      ? isDark
                        ? "#0a2218"
                        : "#e0f5ef"
                      : "transparent",
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
                <span>{model.name}</span>
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
