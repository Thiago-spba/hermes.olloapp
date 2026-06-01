import { memo, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const MODELS_LABEL = {
  "thiago-jr": "⚡ Jr",
  "thiago-senior": "🧠 Sênior",
  "thiago-doutor": "🎓 Doutor",
  "thiago-especialista": "🔬 Especialista",
  "thiago-supremo": "👑 Supremo",
  auto: "🤖 Auto",
};

const MD_STYLES = `
  .hermes-md { font-size: inherit; }
  .hermes-md p { margin: 0 0 6px 0; }
  .hermes-md ul, .hermes-md ol { padding-left: 20px; margin: 4px 0 8px 0; }
  .hermes-md li { margin-bottom: 4px; }
  .hermes-md strong { color: inherit; }
  .hermes-md code { background: rgba(0,229,170,0.1); padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
  .hermes-md pre { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; overflow-x: auto; margin: 8px 0; }
  .hermes-md pre code { background: none; padding: 0; }
  .hermes-md h1, .hermes-md h2, .hermes-md h3 { margin: 8px 0 4px 0; }
  .hermes-md blockquote { border-left: 3px solid #00e5aa; padding-left: 10px; margin: 6px 0; opacity: 0.8; }
  .hermes-md table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  .hermes-md th, .hermes-md td { border: 1px solid rgba(0,229,170,0.2); padding: 6px 10px; font-size: 0.9em; }
  .hermes-md th { background: rgba(0,229,170,0.1); }
  .hermes-md .katex-display { overflow-x: auto; margin: 8px 0; }
  .hermes-md .katex { font-size: 1em; }
`;

const ECGLine = () => (
  <div style={{ width: "100%", height: "48px", overflow: "hidden" }}>
    <style>{`
      @keyframes ecgScroll {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
    `}</style>
    <svg
      viewBox="0 0 600 48"
      preserveAspectRatio="none"
      style={{
        width: "200%",
        height: "100%",
        animation: "ecgScroll 1.8s linear infinite",
        display: "block",
      }}
    >
      <polyline
        points="0,24 30,24 45,24 55,4 65,44 75,10 85,24 100,24 130,24 145,24 155,4 165,44 175,10 185,24 200,24 230,24 245,24 255,4 265,44 275,10 285,24 300,24 330,24 345,24 355,4 365,44 375,10 385,24 400,24 430,24 445,24 455,4 465,44 475,10 485,24 500,24 530,24 545,24 555,4 565,44 575,10 585,24 600,24"
        fill="none"
        stroke="#00e5aa"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: "drop-shadow(0 0 4px #00e5aa)" }}
      />
    </svg>
  </div>
);

// Card visual do arquivo anexado na mensagem do usuário
const FileCard = ({ file, isDark }) => {
  if (!file) return null;
  const isImage = file.type?.startsWith("image/");
  const isPDF = file.type === "application/pdf";
  const sizeKB = file.size ? (file.size / 1024).toFixed(1) : "—";
  const shortName =
    file.name?.length > 28 ? file.name.substring(0, 28) + "..." : file.name;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 10px",
        borderRadius: "8px",
        marginBottom: "6px",
        backgroundColor: isDark ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.06)",
        border: `1px solid ${isDark ? "#1a5c3a" : "#7aada0"}`,
      }}
    >
      {isImage ? (
        <img
          src={file.data}
          alt={file.name}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "6px",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      ) : isPDF ? (
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "6px",
            flexShrink: 0,
            backgroundColor: isDark ? "#1a0a0a" : "#fde8e8",
            border: `1px solid ${isDark ? "#5c1a1a" : "#f5a0a0"}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1px",
          }}
        >
          <span style={{ fontSize: "16px", lineHeight: 1 }}>📄</span>
          <span
            style={{
              fontSize: "7px",
              fontWeight: "700",
              color: isDark ? "#ff6b6b" : "#cc2222",
            }}
          >
            PDF
          </span>
        </div>
      ) : (
        <span style={{ fontSize: "24px", flexShrink: 0 }}>💻</span>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: isDark ? "#e0f5f0" : "#071a14",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {shortName}
        </span>
        <span style={{ fontSize: "10px", color: "#7aada0" }}>
          {isImage ? "Imagem" : isPDF ? "PDF" : "Arquivo"} • {sizeKB} KB
        </span>
      </div>
    </div>
  );
};

const ChatMessage = memo(({ message, isDark }) => {
  const isUser = message.role === "user";
  const isError = message.role === "error";
  const isThinking = message.role === "thinking";
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeaking(window.speechSynthesis.speaking);
      setPaused(window.speechSynthesis.paused);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleSpeak = () => {
    if (speaking) {
      if (paused) window.speechSynthesis.resume();
      else window.speechSynthesis.pause();
    } else {
      const u = new SpeechSynthesisUtterance(message.content);
      if (window.hermesVoice) {
        u.voice = window.hermesVoice;
        u.lang = window.hermesVoice.lang;
      } else u.lang = "pt-BR";
      u.rate = window.hermesRate || 1.1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  };

  const handleStop = (e) => {
    e.stopPropagation();
    window.speechSynthesis.cancel();
  };

  return (
    <div
      style={{
        ...styles.wrapper,
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <style>{MD_STYLES}</style>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
      />
      {!isUser && (
        <img
          src="/favicon-96x96.png"
          alt="Agente IA"
          style={{
            ...styles.avatar,
            borderColor: isDark ? "#143d2e" : "#b0ddd4",
          }}
        />
      )}
      <div
        style={{
          ...styles.bubble,
          backgroundColor: isError
            ? "#2a0a0a"
            : isUser
              ? isDark
                ? "#0d2e1f"
                : "#ccede5"
              : isDark
                ? "#0a2218"
                : "#e0f5ef",
          borderColor: isError
            ? "#ff4455"
            : isUser
              ? isDark
                ? "#1a5c3a"
                : "#7aada0"
              : isDark
                ? "#143d2e"
                : "#b0ddd4",
          borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
          minWidth: isThinking ? "220px" : undefined,
        }}
      >
        {isThinking ? (
          <ECGLine />
        ) : (
          <>
            {/* Card do arquivo anexado — só na mensagem do usuário */}
            {isUser && message.file && (
              <FileCard file={message.file} isDark={isDark} />
            )}

            {/* Texto da mensagem — oculta se só tem arquivo sem texto */}
            {(message.content || !message.file) && (
              <div
                className="hermes-md"
                style={{
                  ...styles.text,
                  color: isError ? "#ff6677" : isDark ? "#e0f5f0" : "#071a14",
                }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {message.content || ""}
                </ReactMarkdown>
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "4px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span
                  style={{
                    ...styles.time,
                    color: isDark ? "#3d6b5e" : "#7aada0",
                  }}
                >
                  {message.time}
                </span>
                {message.modelKey && !isUser && !isError && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "#00e5aa",
                      opacity: 0.6,
                      backgroundColor: isDark ? "#071a14" : "#e0f5ef",
                      padding: "1px 5px",
                      borderRadius: "4px",
                      border: "1px solid rgba(0,229,170,0.2)",
                    }}
                  >
                    {MODELS_LABEL[message.modelKey] || message.modelKey}
                  </span>
                )}
              </div>
              {!isUser && !isError && message.content && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
                  {speaking && (
                    <button
                      onClick={handleStop}
                      title="Parar"
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "11px",
                        padding: "0 2px",
                        color: "#ff4455",
                      }}
                    >
                      ⏹
                    </button>
                  )}
                  <button
                    onClick={handleSpeak}
                    title={speaking ? (paused ? "Retomar" : "Pausar") : "Ouvir"}
                    style={{
                      background: speaking
                        ? isDark
                          ? "#143d2e"
                          : "#ccede5"
                        : "transparent",
                      border: speaking
                        ? `1px solid ${isDark ? "#00e5aa" : "#007a55"}`
                        : "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      padding: "0 3px",
                      color: speaking
                        ? paused
                          ? "#ffaa00"
                          : "#00e5aa"
                        : isDark
                          ? "#3d6b5e"
                          : "#7aada0",
                    }}
                  >
                    {speaking ? (paused ? "▶" : "⏸") : "🔊"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    marginBottom: "12px",
    padding: "0 12px",
  },
  avatar: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    border: "1px solid",
    boxShadow: "0 0 8px rgba(0,229,255,0.15)",
    transition: "border-color 0.3s ease",
  },
  bubble: {
    maxWidth: "80%",
    padding: "10px 14px",
    border: "1px solid",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },
  text: {
    fontSize: "var(--font-size-base)",
    lineHeight: "1.6",
    transition: "color 0.3s ease",
  },
  time: { display: "block", fontSize: "10px", transition: "color 0.3s ease" },
};

export default ChatMessage;
