import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { auth } from "./services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import Header from "./components/Header";
import ChatMessage from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import Login from "./components/Login";
import PinSetup from "./components/PinSetup";
import ConversationList from "./components/ConversationList";
import ModelSelector from "./components/ModelSelector";
import ProjectsModal from "./components/ProjectsModal";
import KnowledgePanel from "./components/KnowledgePanel";
import useChat from "./hooks/useChat";
import useConversation from "./hooks/useConversation";
import { checkHealth } from "./services/api";

// ============ COMPONENTE DE BOAS-VINDAS ============
const WelcomeScreen = ({ onSend, isDark, suggestions, selectedModel }) => {
  const [typedText, setTypedText] = useState("");
  const fullText = "Não há problema sem solução. Apresente o seu?";

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.welcomeContainer}>
      <div style={styles.welcomeContent}>
        <div style={styles.welcomeIcon}>
          <span style={styles.iconMain}>🤖</span>
          <span style={styles.iconSpark}>⚡</span>
        </div>

        <h1 style={styles.welcomeTitle}>
          HERMES
          <span style={styles.welcomeBadge}>AI Agent</span>
        </h1>

        <p
          style={{
            ...styles.welcomeSubtitle,
            color: isDark ? "#a0c0b8" : "#2a6b5a",
          }}
        >
          {typedText}
          <span style={styles.cursor}>|</span>
        </p>

        <div
          style={{
            ...styles.modelStatus,
            backgroundColor: isDark ? "#0d2e1f" : "#e0f5ef",
            borderColor: isDark ? "#143d2e" : "#b0ddd4",
          }}
        >
          <span style={styles.modelStatusDot}></span>
          <span>Modelo ativo: {selectedModel}</span>
        </div>

        <div style={styles.suggestionsGrid}>
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              onClick={() => onSend(suggestion.text)}
              style={{
                ...styles.suggestionButton,
                backgroundColor: isDark ? "#0d2e1f" : "#e0f5ef",
                borderColor: isDark ? "#143d2e" : "#b0ddd4",
                color: isDark ? "#00e5aa" : "#007a55",
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.backgroundColor = isDark ? "#143d2e" : "#c8eae2";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.backgroundColor = isDark ? "#0d2e1f" : "#e0f5ef";
              }}
            >
              <span style={styles.suggestionIcon}>{suggestion.icon}</span>
              <span>{suggestion.text}</span>
            </button>
          ))}
        </div>

        <div
          style={{
            ...styles.tipsContainer,
            color: isDark ? "#5a8a7a" : "#9ac0b5",
          }}
        >
          <div style={styles.tip}>
            <kbd style={styles.kbd}>Enter</kbd>
            <span>Enviar mensagem</span>
          </div>
          <div style={styles.tip}>
            <kbd style={styles.kbd}>Shift + Enter</kbd>
            <span>Nova linha</span>
          </div>
          <div style={styles.tip}>
            <kbd style={styles.kbd}>📎</kbd>
            <span>Enviar arquivo</span>
          </div>
          <div style={styles.tip}>
            <kbd style={styles.kbd}>🎤</kbd>
            <span>Entrada de voz</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ COMPONENTE DE CARREGAMENTO ============
const LoadingScreen = ({ isDark }) => (
  <div style={styles.loadingContainer}>
    <div style={styles.loadingContent}>
      <div style={styles.loadingIcon}>⚡</div>
      <div style={styles.loadingText}>Inicializando HERMES...</div>
      <div style={styles.loadingDots}>
        <span style={styles.loadingDot}></span>
        <span style={styles.loadingDot}></span>
        <span style={styles.loadingDot}></span>
      </div>
    </div>
  </div>
);

// ============ APP PRINCIPAL ============
const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [studyMode, setStudyMode] = useState(false);

  const mainRef = useRef(null);
  const msgRefs = useRef({});

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const container = mainRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }, []);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("hermes-theme");
    return saved ? saved === "dark" : true;
  });

  const {
    conversationId,
    conversations,
    loadingHistory,
    onMessagesUpdate,
    finishAndStartNew,
    resumeConversation,
    resumeSavedConversation,
    loadHistory,
    removeConversation,
  } = useConversation(user?.uid);

  const {
    messages,
    isLoading,
    sendUserMessage,
    clearChat,
    loadMessages,
    selectedModel,
    changeModel,
  } = useChat(studyMode);

  const welcomeSuggestions = useMemo(
    () => [
      { icon: "📊", text: "Analisar dados" },
      { icon: "💻", text: "Debug código" },
      { icon: "📚", text: "Explicar conceito" },
      { icon: "🔧", text: "Resolver problema" },
      { icon: "📝", text: "Revisar documento" },
      { icon: "🧠", text: "Ativar Modo Estudo" },
      { icon: "🔒", text: "Segurança da informação" },
      { icon: "🚀", text: "Otimização de performance" },
    ],
    [],
  );

  // Verifica se mostra tela de boas-vindas (apenas quando só tem a mensagem inicial)
  const showWelcomeScreen =
    !isLoading && messages.filter((m) => m.role === "user").length === 0;

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      scrollToBottom();
    }
  }, [isLoading, messages.length, scrollToBottom]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        const pinDone = localStorage.getItem(
          "hermes-pin-setup-" + firebaseUser.uid,
        );
        if (!pinDone) setShowPinSetup(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadSavedConversation = async () => {
      const conv = await resumeSavedConversation();
      if (conv?.messages?.length > 0) {
        loadMessages(conv.messages);
      }
    };
    loadSavedConversation();
  }, [user, resumeSavedConversation, loadMessages]);

  useEffect(() => {
    if (conversationId && messages.length > 0) {
      onMessagesUpdate(messages);
    }
  }, [conversationId, messages, onMessagesUpdate]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("light");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("light");
      root.style.colorScheme = "light";
    }
    localStorage.setItem("hermes-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const verifyConnection = async () => {
      setIsConnected(await checkHealth());
    };
    verifyConnection();
    const interval = setInterval(verifyConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const handleLogout = async () => {
    await signOut(auth);
    clearChat();
    localStorage.removeItem("hermes-conv-id");
  };

  const handleHistoryClick = async () => {
    await loadHistory();
    setShowHistory(true);
  };

  const handleSelectConversation = async (conv) => {
    const messages = await resumeConversation(conv.id);
    if (messages && messages.length > 0) {
      loadMessages(messages);
    }
    setShowHistory(false);
  };

  const handleNewConversation = async () => {
    await finishAndStartNew(messages);
    clearChat();
    setShowHistory(false);
  };

  const handleSelectProject = (project) => {
    sendUserMessage(
      `Vou te falar sobre meu projeto "${project.name}". ${project.description ? project.description + ". " : ""}${project.context ? "Detalhes: " + project.context : ""}`,
      null,
      null,
    );
  };

  const handleSendMessage = (text, file, audio) => {
    sendUserMessage(text, file, audio);
    scrollToBottom();
  };

  if (authLoading) return <LoadingScreen isDark={isDark} />;
  if (!user)
    return (
      <Login onLogin={setUser} isDark={isDark} onToggleTheme={toggleTheme} />
    );

  return (
    <div
      style={{ ...styles.app, backgroundColor: isDark ? "#071a14" : "#f0faf7" }}
    >
      {showPinSetup && (
        <PinSetup
          user={user}
          isDark={isDark}
          onComplete={() => setShowPinSetup(false)}
        />
      )}

      {showHistory && (
        <ConversationList
          conversations={conversations}
          loadingHistory={loadingHistory}
          onSelect={handleSelectConversation}
          onClose={() => setShowHistory(false)}
          onNew={handleNewConversation}
          onDelete={removeConversation}
          userId={user?.uid}
          isDark={isDark}
        />
      )}

      {showProjects && (
        <ProjectsModal
          isDark={isDark}
          onClose={() => setShowProjects(false)}
          onSelectProject={handleSelectProject}
        />
      )}

      {showKnowledge && (
        <KnowledgePanel
          isDark={isDark}
          onClose={() => setShowKnowledge(false)}
        />
      )}

      <Header
        isConnected={isConnected}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        user={user}
        onLogout={handleLogout}
        onHistoryClick={handleHistoryClick}
        onProjectsClick={() => setShowProjects(true)}
        onKnowledgeClick={() => setShowKnowledge(true)}
        studyMode={studyMode}
        onToggleStudyMode={setStudyMode}
      />

      {studyMode && (
        <div
          style={{
            ...styles.studyBanner,
            backgroundColor: isDark ? "#0d2e1f" : "#e0f5ef",
            borderColor: isDark ? "#143d2e" : "#b0ddd4",
            color: isDark ? "#00e5aa" : "#007a55",
          }}
        >
          <span>💡</span>
          <span style={{ fontWeight: "600" }}>Modo Estudo ativo</span>
          <span style={{ opacity: 0.7 }}>— Conceito → Exemplo → Exercício</span>
          <button
            onClick={() => setStudyMode(false)}
            style={styles.studyBannerClose}
          >
            ✕
          </button>
        </div>
      )}

      <main ref={mainRef} style={styles.main}>
        {/* CORREÇÃO AQUI: usa showWelcomeScreen em vez de messages.length === 0 */}
        {showWelcomeScreen ? (
          <WelcomeScreen
            onSend={handleSendMessage}
            isDark={isDark}
            suggestions={welcomeSuggestions}
            selectedModel={selectedModel}
          />
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                ref={(el) => {
                  if (el) msgRefs.current[message.id] = el;
                }}
              >
                <ChatMessage message={message} isDark={isDark} />
              </div>
            ))}

            {isLoading && (
              <div style={styles.typing}>
                <div
                  style={{
                    ...styles.typingBubble,
                    backgroundColor: isDark ? "#0a2218" : "#e0f5ef",
                    borderColor: isDark ? "#143d2e" : "#b0ddd4",
                  }}
                >
                  <span
                    style={{ ...styles.typingDot, animationDelay: "0ms" }}
                  />
                  <span
                    style={{ ...styles.typingDot, animationDelay: "200ms" }}
                  />
                  <span
                    style={{ ...styles.typingDot, animationDelay: "400ms" }}
                  />
                </div>
              </div>
            )}

            {messages.filter((m) => m.role === "user").length > 0 && (
              <button
                onClick={handleNewConversation}
                style={{
                  ...styles.clearButton,
                  borderColor: isDark ? "#143d2e" : "#b0ddd4",
                  color: isDark ? "#3d6b5e" : "#7aada0",
                }}
              >
                ✨ Nova conversa
              </button>
            )}
          </>
        )}
      </main>

      <ModelSelector
        selectedModel={selectedModel}
        onModelChange={changeModel}
        isDark={isDark}
      />

      <ChatInput
        onSend={handleSendMessage}
        isLoading={isLoading}
        isDark={isDark}
      />
    </div>
  );
};

// ============ ESTILOS ============
const styles = {
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    maxWidth: "768px",
    margin: "0 auto",
    position: "relative",
    transition: "background-color 0.3s ease",
  },
  main: {
    flex: 1,
    overflowY: "auto",
    paddingTop: "16px",
    paddingBottom: "8px",
    WebkitOverflowScrolling: "touch",
  },
  welcomeContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100vh - 200px)",
    animation: "fadeIn 0.6s ease-out",
  },
  welcomeContent: {
    textAlign: "center",
    maxWidth: "600px",
    margin: "0 auto",
    padding: "20px",
  },
  welcomeIcon: {
    position: "relative",
    display: "inline-block",
    marginBottom: "24px",
  },
  iconMain: {
    fontSize: "72px",
    display: "inline-block",
    animation: "float 3s ease-in-out infinite",
  },
  iconSpark: {
    position: "absolute",
    fontSize: "24px",
    right: "-10px",
    top: "0",
    animation: "spark 2s ease-in-out infinite",
  },
  welcomeTitle: {
    fontSize: "42px",
    fontWeight: "bold",
    marginBottom: "16px",
    background: "linear-gradient(135deg, #00e5ff, #00ffaa, #00e5ff)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: "shimmer 3s linear infinite",
  },
  welcomeBadge: {
    fontSize: "14px",
    background: "rgba(0, 229, 255, 0.2)",
    padding: "4px 8px",
    borderRadius: "20px",
    marginLeft: "12px",
    WebkitTextFillColor: "initial",
    color: "#00e5ff",
  },
  welcomeSubtitle: {
    fontSize: "18px",
    marginBottom: "32px",
    fontFamily: "monospace",
  },
  cursor: {
    animation: "blink 1s step-end infinite",
    marginLeft: "2px",
  },
  modelStatus: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    borderRadius: "20px",
    border: "1px solid",
    fontSize: "12px",
    marginBottom: "32px",
  },
  modelStatusDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#00ffaa",
    animation: "pulse 2s infinite",
  },
  suggestionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "12px",
    marginBottom: "32px",
  },
  suggestionButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "10px 16px",
    border: "1px solid",
    borderRadius: "12px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontWeight: "500",
  },
  suggestionIcon: {
    fontSize: "16px",
  },
  tipsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "16px",
    fontSize: "12px",
    padding: "12px",
    borderTop: "1px solid rgba(0, 229, 255, 0.2)",
  },
  tip: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  kbd: {
    background: "rgba(0, 229, 255, 0.1)",
    padding: "2px 6px",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "11px",
    border: "1px solid rgba(0, 229, 255, 0.3)",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100dvh",
    backgroundColor: "#071a14",
  },
  loadingContent: {
    textAlign: "center",
  },
  loadingIcon: {
    fontSize: "48px",
    animation: "spin 2s linear infinite",
    marginBottom: "20px",
  },
  loadingText: {
    color: "#00e5ff",
    fontSize: "18px",
    marginBottom: "16px",
  },
  loadingDots: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  },
  loadingDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "#00e5ff",
    animation: "pulse 1.5s infinite",
  },
  typing: {
    padding: "0 12px 8px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  typingBubble: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    border: "1px solid",
    borderRadius: "12px 12px 12px 2px",
    padding: "10px 14px",
    transition: "background-color 0.3s ease",
  },
  typingDot: {
    display: "inline-block",
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    backgroundColor: "#00e5ff",
    animation: "pulse 1.2s infinite",
  },
  clearButton: {
    display: "block",
    margin: "8px auto 16px",
    padding: "6px 16px",
    backgroundColor: "transparent",
    border: "1px solid",
    borderRadius: "20px",
    fontSize: "12px",
    cursor: "pointer",
    transition: "border-color 0.2s ease",
  },
  studyBanner: {
    borderBottom: "1px solid",
    padding: "6px 16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
  },
  studyBannerClose: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
};

// ============ ANIMAÇÕES CSS ============
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  @keyframes spark {
    0%, 100% { opacity: 0; transform: scale(0.5); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes shimmer {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes pulse {
    0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
    30% { opacity: 1; transform: scale(1.2); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;
