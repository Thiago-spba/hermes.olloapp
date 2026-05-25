import { useEffect, useState } from "react";
import { deleteConversation } from "../services/firestoreService";

const ConversationList = ({
  conversations,
  loadingHistory,
  onSelect,
  onClose,
  onNew,
  onDelete,
  isDark,
  userId,
}) => {
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // FILTRO: Só considera conversas que tenham pelo menos 1 mensagem do usuário (Thiago)
  const validConversations = conversations.filter(
    (conv) => conv.messages && conv.messages.some((m) => m.role === "user"),
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const time = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (days === 0) return `Hoje às ${time}`;
    if (days === 1) return `Ontem às ${time}`;
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const getTitle = (conv) => {
    if (conv.title && conv.title !== "Nova conversa") return conv.title;
    const first = conv.messages?.find((m) => m.role === "user");
    if (first?.content)
      return (
        first.content.slice(0, 40) + (first.content.length > 40 ? "..." : "")
      );
    return "Conversa sem título";
  };

  const handleDelete = async (e, conv) => {
    e.stopPropagation();
    if (!window.confirm("Excluir esta conversa?")) return;
    try {
      await deleteConversation(userId, conv.id);
      if (typeof onDelete === "function") onDelete(conv.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async (minutes) => {
    const label =
      minutes === 0
        ? "TODAS as conversas"
        : `conversas das últimas ${minutes >= 60 ? minutes / 60 + " hora(s)" : minutes + " minutos"}`;
    if (!window.confirm(`Excluir ${label}?`)) return;
    setShowDeleteMenu(false);
    const now = new Date();
    const toDelete =
      minutes === 0
        ? validConversations
        : validConversations.filter((c) => {
            const date = c.updatedAt?.toDate
              ? c.updatedAt.toDate()
              : new Date(c.updatedAt);
            return now - date <= minutes * 60 * 1000;
          });
    for (const conv of toDelete) {
      try {
        await deleteConversation(userId, conv.id);
        if (typeof onDelete === "function") onDelete(conv.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const c = {
    bg: isDark ? "#0a2218" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    hover: isDark ? "#0d2e1f" : "#f0faf7",
    overlay: isDark ? "rgba(7,26,20,0.6)" : "rgba(0,0,0,0.3)",
  };

  const deleteOptions = [
    { label: "Últimos 30 min", minutes: 30 },
    { label: "Última 1 hora", minutes: 60 },
    { label: "Últimas 2 horas", minutes: 120 },
    { label: "Últimas 3 horas", minutes: 180 },
    { label: "Tudo", minutes: 0 },
  ];

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          backgroundColor: c.overlay,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "60px",
          right: "16px",
          zIndex: 201,
          width: "320px",
          maxWidth: "calc(100vw - 32px)",
          maxHeight: "70vh",
          backgroundColor: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: "12px",
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.6)"
            : "0 8px 32px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: `1px solid ${c.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: "700",
              color: isDark ? "#00e5ff" : "#0099bb",
            }}
          >
            Histórico
          </span>
          <div style={{ display: "flex", gap: "6px", position: "relative" }}>
            <button
              onClick={() => setShowDeleteMenu((v) => !v)}
              title="Excluir em massa"
              style={{
                backgroundColor: isDark ? "#1a0a0a" : "#ffe0e0",
                border: `1px solid #ff4455`,
                borderRadius: "6px",
                padding: "5px 10px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#ff4455",
                cursor: "pointer",
              }}
            >
              🗑 Excluir
            </button>
            <button
              onClick={onNew}
              style={{
                backgroundColor: "#00e5ff",
                border: "none",
                borderRadius: "6px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: "600",
                color: "#071a14",
                cursor: "pointer",
              }}
            >
              + Nova
            </button>
            {showDeleteMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  right: 0,
                  zIndex: 300,
                  backgroundColor: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: "8px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  minWidth: "180px",
                  overflow: "hidden",
                }}
              >
                {deleteOptions.map((opt) => (
                  <button
                    key={opt.minutes}
                    onClick={() => handleBulkDelete(opt.minutes)}
                    style={{
                      width: "100%",
                      padding: "10px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      borderBottom: `1px solid ${c.border}`,
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: "13px",
                      color: opt.minutes === 0 ? "#ff4455" : c.text,
                      fontWeight: opt.minutes === 0 ? "700" : "400",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = c.hover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1 }}>
          {loadingHistory ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: c.sub,
                fontSize: "13px",
              }}
            >
              Carregando...
            </div>
          ) : validConversations.length === 0 ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                color: c.sub,
                fontSize: "13px",
              }}
            >
              Nenhuma conversa com mensagens.
            </div>
          ) : (
            validConversations.map((conv) => (
              <div
                key={conv.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderBottom: `1px solid ${c.border}`,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = c.hover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <button
                  onClick={() => {
                    onSelect(conv);
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: c.text,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getTitle(conv)}
                  </span>
                  <span style={{ fontSize: "11px", color: c.sub }}>
                    {formatDate(conv.updatedAt)} ·{" "}
                    {conv.messages?.filter((m) => m.role === "user").length ||
                      0}{" "}
                    perguntas
                  </span>
                </button>
                <button
                  onClick={(e) => handleDelete(e, conv)}
                  title="Excluir"
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 12px",
                    color: "#ff4455",
                    fontSize: "16px",
                    flexShrink: 0,
                  }}
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ConversationList;
