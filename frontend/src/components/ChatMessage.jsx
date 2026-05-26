import { memo, useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const MODELS_LABEL = {
  "thiago-jr": "⚡ Jr",
  "thiago-senior": "🧠 Sênior",
  "thiago-doutor": "🎓 Doutor",
  "thiago-especialista": "🔬 Especialista",
  "thiago-supremo": "👑 Supremo",
  auto: "🤖 Auto",
};

const ThinkingDots = ({ isDark }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 2px" }}>
    {[0, 1, 2].map((i) => (
      <div key={i} style={{
        width: "10px", height: "10px", borderRadius: "50%",
        backgroundColor: "#00e5aa",
        animation: "hermesThink 1.2s ease-in-out infinite",
        animationDelay: `${i * 0.2}s`,
      }} />
    ))}
    <style>{`
      @keyframes hermesThink {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 8px #00e5aa; }
      }
      .hermes-md p { margin: 0 0 6px 0; }
      .hermes-md ul, .hermes-md ol { padding-left: 20px; margin: 4px 0 8px 0; }
      .hermes-md li { margin-bottom: 4px; }
      .hermes-md strong { color: inherit; }
      .hermes-md code { background: rgba(0,229,170,0.1); padding: 1px 5px; border-radius: 4px; font-size: 0.9em; }
      .hermes-md pre { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; overflow-x: auto; margin: 8px 0; }
      .hermes-md pre code { background: none; padding: 0; }
      .hermes-md h1, .hermes-md h2, .hermes-md h3 { margin: 8px 0 4px 0; }
      .hermes-md blockquote { border-left: 3px solid #00e5aa; padding-left: 10px; margin: 6px 0; opacity: 0.8; }
    `}</style>
  </div>
);

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
    <div style={{ ...styles.wrapper, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && (
        <img
          src="/favicon-96x96.png"
          alt="Agente IA"
          style={{ ...styles.avatar, borderColor: isDark ? "#143d2e" : "#b0ddd4" }}
        />
      )}
      <div style={{
        ...styles.bubble,
        backgroundColor: isError ? "#2a0a0a" : isUser ? (isDark ? "#0d2e1f" : "#ccede5") : (isDark ? "#0a2218" : "#e0f5ef"),
        borderColor: isError ? "#ff4455" : isUser ? (isDark ? "#1a5c3a" : "#7aada0") : (isDark ? "#143d2e" : "#b0ddd4"),
        borderRadius: isUser ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
      }}>
        {isThinking ? (
          <ThinkingDots isDark={isDark} />
        ) : (
          <>
            <div
              className="hermes-md"
              style={{ ...styles.text, color: isError ? "#ff6677" : isDark ? "#e0f5f0" : "#071a14" }}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ ...styles.time, color: isDark ? "#3d6b5e" : "#7aada0" }}>
                  {message.time}
                </span>
                {message.modelKey && !isUser && !isError && (
                  <span style={{
                    fontSize: "10px", color: "#00e5aa", opacity: 0.6,
                    backgroundColor: isDark ? "#071a14" : "#e0f5ef",
                    padding: "1px 5px", borderRadius: "4px",
                    border: "1px solid rgba(0,229,170,0.2)",
                  }}>
                    {MODELS_LABEL[message.modelKey] || message.modelKey}
                  </span>
                )}
              </div>
              {!isUser && !isError && message.content && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {speaking && (
                    <button onClick={handleStop} title="Parar" style={{
                      background: "transparent", border: "none", cursor: "pointer",
                      fontSize: "11px", padding: "0 2px", color: "#ff4455",
                    }}>⏹</button>
                  )}
                  <button
                    onClick={handleSpeak}
                    title={speaking ? (paused ? "Retomar" : "Pausar") : "Ouvir"}
                    style={{
                      background: speaking ? (isDark ? "#143d2e" : "#ccede5") : "transparent",
                      border: speaking ? `1px solid ${isDark ? "#00e5aa" : "#007a55"}` : "none",
                      borderRadius: "4px", cursor: "pointer", fontSize: "12px", padding: "0 3px",
                      color: speaking ? (paused ? "#ffaa00" : "#00e5aa") : (isDark ? "#3d6b5e" : "#7aada0"),
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
    display: "flex", alignItems: "flex-end", gap: "8px",
    marginBottom: "12px", padding: "0 12px",
  },
  avatar: {
    width: "28px", height: "28px", borderRadius: "50%",
    objectFit: "cover", flexShrink: 0, border: "1px solid",
    boxShadow: "0 0 8px rgba(0, 229, 255, 0.15)",
    transition: "border-color 0.3s ease",
  },
  bubble: {
    maxWidth: "80%", padding: "10px 14px", border: "1px solid",
    wordBreak: "break-word", overflowWrap: "break-word",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },
  text: {
    fontSize: "var(--font-size-base)", lineHeight: "1.6",
    transition: "color 0.3s ease",
  },
  time: {
    display: "block", fontSize: "10px",
    transition: "color 0.3s ease",
  },
};

export default ChatMessage;