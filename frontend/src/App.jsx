import { useState, useEffect, useRef, useCallback } from "react";
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
import NotebookPanel from "./components/NotebookPanel";
import useChat from "./hooks/useChat";
import useConversation from "./hooks/useConversation";
import { checkHealth } from "./services/api";

const WelcomeScreen = ({ isDark }) => {
  const [greeting, setGreeting] = useState("");
  const [typedText, setTypedText] = useState("");
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [fadePhrase, setFadePhrase] = useState(true);
  const rotatingPhrases = [
    { icon: "💻", text: "O código é poesia" },
    { icon: "📚", text: "Aprender é evoluir" },
    { icon: "🎙️", text: "Pergunte sem medo" },
    { icon: "📎", text: "Arraste arquivos aqui" },
    { icon: "🧠", text: "Modo Estudo transforma respostas" },
    { icon: "🔍", text: "Analiso imagens e documentos" },
    { icon: "⚡", text: "Respostas em tempo real" },
    { icon: "🎓", text: "Thiago Doutor disponível" },
  ];
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Bom dia");
    else if (hour >= 12 && hour < 18) setGreeting("Boa tarde");
    else if (hour >= 18 && hour < 24) setGreeting("Boa noite");
    else setGreeting("Boa madrugada");
  }, []);
  useEffect(() => {
    if (!greeting) return;
    const fullText = `${greeting}! Como posso ajudar você hoje?`;
    let i = 0;
    setTypedText("");
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else clearInterval(timer);
    }, 60);
    return () => clearInterval(timer);
  }, [greeting]);
  useEffect(() => {
    const interval = setInterval(() => {
      setFadePhrase(false);
      setTimeout(() => {
        setCurrentPhraseIndex((prev) => (prev + 1) % rotatingPhrases.length);
        setFadePhrase(true);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const currentPhrase = `${rotatingPhrases[currentPhraseIndex].icon} "${rotatingPhrases[currentPhraseIndex].text}"`;
  return (
    <div style={styles.welcomeContainer}>
      <div style={styles.welcomeContent}>
        <div style={styles.codeAnimation}>
          <span
            style={{
              ...styles.codeChar,
              animation: "floatSoft 2.5s ease-in-out infinite",
              animationDelay: "0s",
            }}
          >
            &lt;
          </span>
          <span
            style={{
              ...styles.codeChar,
              animation: "floatSoft 2.5s ease-in-out infinite",
              animationDelay: "0.4s",
            }}
          >
            /
          </span>
          <span
            style={{
              ...styles.codeChar,
              animation: "floatSoft 2.5s ease-in-out infinite",
              animationDelay: "0.8s",
            }}
          >
            &gt;
          </span>
        </div>
        <div style={styles.greetingContainer}>
          <p
            style={{
              ...styles.greetingText,
              color: isDark ? "#e0e0e0" : "#1a1a1a",
            }}
          >
            {typedText}
            <span style={styles.cursor}>|</span>
          </p>
        </div>
        <div style={styles.rotatingContainer}>
          <div
            style={{
              ...styles.rotatingText,
              backgroundColor: isDark
                ? "rgba(0,229,255,0.08)"
                : "rgba(0,114,86,0.06)",
              color: isDark ? "#00e5aa" : "#007a55",
              opacity: fadePhrase ? 1 : 0,
              transform: fadePhrase ? "translateY(0)" : "translateY(5px)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            {currentPhrase}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingScreen = () => (
  <div style={styles.loadingContainer}>
    <div style={styles.loadingContent}>
      <div style={styles.codeAnimationLoading}>
        <span
          style={{
            ...styles.codeCharLoading,
            animation: "floatSoft 2.5s ease-in-out infinite",
            animationDelay: "0s",
          }}
        >
          &lt;
        </span>
        <span
          style={{
            ...styles.codeCharLoading,
            animation: "floatSoft 2.5s ease-in-out infinite",
            animationDelay: "0.4s",
          }}
        >
          /
        </span>
        <span
          style={{
            ...styles.codeCharLoading,
            animation: "floatSoft 2.5s ease-in-out infinite",
            animationDelay: "0.8s",
          }}
        >
          &gt;
        </span>
      </div>
      <div style={styles.loadingText}>Inicializando HERMES...</div>
    </div>
  </div>
);

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showNotebook, setShowNotebook] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const mainRef = useRef(null);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef(null);
  const saveDebounceRef = useRef(null);
  const lastAssistantCountRef = useRef(0);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("hermes-theme");
    return saved ? saved === "dark" : true;
  });

  const [docMode, setDocMode] = useState(() => {
    return localStorage.getItem("hermes-doc-mode") === "1";
  });
  useEffect(() => {
    localStorage.setItem("hermes-doc-mode", docMode ? "1" : "0");
  }, [docMode]);
  const toggleDocMode = () => setDocMode((prev) => !prev);

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
    startNewConversation,
  } = useConversation(user?.uid);
  const userId = user?.uid;
  const {
    messages,
    isLoading,
    sendUserMessage,
    clearChat,
    loadMessages,
    selectedModel,
    changeModel,
    activeProject,
    setActiveProject,
  } = useChat(studyMode);
  const showWelcomeScreen =
    !isLoading && messages.filter((m) => m.role === "user").length === 0;

  const scrollToBottom = useCallback(() => {
    if (isUserScrolling.current) return;
    setTimeout(() => {
      const c = mainRef.current;
      if (c) c.scrollTo({ top: c.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  const handleUserScroll = useCallback(() => {
    isUserScrolling.current = true;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 3000);
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.role === "user") scrollToBottom();
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    if (isLoading) scrollToBottom();
  }, [isLoading, scrollToBottom]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        const p = localStorage.getItem("hermes-pin-setup-" + firebaseUser.uid);
        if (!p) setShowPinSetup(true);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const conv = await resumeSavedConversation();
      if (conv?.messages?.length > 0) {
        lastAssistantCountRef.current = conv.messages.filter(
          (m) => m.role === "assistant",
        ).length;
        loadMessages(conv.messages);
      }
    };
    load();
  }, [user, resumeSavedConversation, loadMessages]);

  useEffect(() => {
    if (!userId || isLoading) return;
    const assistantMsgs = messages.filter(
      (m) => m.role === "assistant" && m.content,
    );
    if (assistantMsgs.length === 0) return;
    if (assistantMsgs.length <= lastAssistantCountRef.current) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      const current = messages.filter(
        (m) => m.role === "assistant" && m.content,
      ).length;
      if (current <= lastAssistantCountRef.current) return;
      lastAssistantCountRef.current = current;
      await onMessagesUpdate(messages);
    }, 1500);
  }, [isLoading, messages, userId, onMessagesUpdate]);

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
    const verify = async () => {
      setIsConnected(await checkHealth());
    };
    verify();
    const interval = setInterval(verify, 30000);
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
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    const msgs = await resumeConversation(conv.id);
    if (msgs && msgs.length > 0) {
      lastAssistantCountRef.current = msgs.filter(
        (m) => m.role === "assistant",
      ).length;
      loadMessages(msgs);
    }
    setShowHistory(false);
  };

  const handleNewConversation = async () => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    lastAssistantCountRef.current = 0;
    await finishAndStartNew(messages);
    clearChat();
    setShowHistory(false);
  };

  const handleSelectProject = (project) => {
    setActiveProject(project);
    setShowProjects(false);
  };

  const handleSendMessage = (text, file, audio, useRAG) => {
    sendUserMessage(text, file, audio, useRAG);
  };

  if (authLoading) return <LoadingScreen />;
  if (!user)
    return (
      <Login onLogin={setUser} isDark={isDark} onToggleTheme={toggleTheme} />
    );

  return (
    <div
      style={{
        ...styles.app,
        backgroundColor: docMode ? "#ffffff" : isDark ? "#071a14" : "#f5faf8",
        maxWidth: docMode ? "100%" : styles.app.maxWidth,
      }}
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
          userId={user?.uid}
        />
      )}
      {showKnowledge && (
        <KnowledgePanel
          isDark={isDark}
          onClose={() => setShowKnowledge(false)}
        />
      )}
      {showNotebook && (
        <NotebookPanel
          isDark={isDark}
          onClose={() => setShowNotebook(false)}
          userId={user?.uid}
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
        onNotebookClick={() => setShowNotebook(true)}
        studyMode={studyMode}
        onToggleStudyMode={setStudyMode}
        docMode={docMode}
        onToggleDocMode={toggleDocMode}
      />
      {activeProject && (
        <div
          style={{
            ...styles.studyBanner,
            backgroundColor: isDark ? "#0d2e1f" : "#e0f5ef",
            borderColor: isDark ? "#143d2e" : "#b0ddd4",
            color: isDark ? "#00e5ff" : "#0099bb",
          }}
        >
          <span>📁</span>
          <span style={{ fontWeight: "600" }}>Projeto ativo: {activeProject.name}</span>
          <button
            onClick={() => setActiveProject(null)}
            style={styles.studyBannerClose}
          >
            ✕
          </button>
        </div>
      )}
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
      <main
        ref={mainRef}
        style={
          docMode
            ? {
                ...styles.main,
                backgroundColor: "#ffffff",
                width: "100%",
                maxWidth: "100%",
                margin: 0,
                padding: "clamp(16px, 4vw, 48px) clamp(16px, 6vw, 64px)",
                boxShadow: "none",
                borderRadius: 0,
                boxSizing: "border-box",
                flex: 1,
              }
            : styles.main
        }
        onScroll={handleUserScroll}
      >
        {docMode && !showWelcomeScreen && (
          <div
            style={{
              textAlign: "center",
              marginBottom: "28px",
              paddingBottom: "16px",
              borderBottom: "2px solid #071a14",
            }}
          >
            <div style={{ fontSize: "clamp(18px, 5vw, 24px)", fontWeight: "800", letterSpacing: "3px", color: "#071a14" }}>
              HERMES
            </div>
            <div style={{ fontSize: "clamp(10px, 2.5vw, 12px)", color: "#666666", marginTop: "4px" }}>
              Registro da Conversa — {new Date().toLocaleDateString("pt-BR")}
            </div>
          </div>
        )}
        {showWelcomeScreen ? (
          <WelcomeScreen isDark={isDark} />
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessage message={message} isDark={isDark} docMode={docMode} />
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
      {!docMode && (
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={changeModel}
          isDark={isDark}
        />
      )}
      <ChatInput
        onSend={handleSendMessage}
        isLoading={isLoading}
        isDark={isDark}
        selectedModel={selectedModel}
      />
    </div>
  );
};

const styles = {
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    position: "relative",
    transition: "background-color 0.3s ease",
    boxShadow: "0 0 20px rgba(0,0,0,0.05)",
  },
  main: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "16px",
    paddingBottom: "8px",
    WebkitOverflowScrolling: "touch",
  },
  welcomeContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "calc(100vh - 200px)",
    padding: "20px",
  },
  welcomeContent: {
    textAlign: "center",
    maxWidth: "600px",
    width: "100%",
    margin: "0 auto",
    padding: "20px",
  },
  codeAnimation: {
    display: "flex",
    justifyContent: "center",
    gap: "clamp(8px, 4vw, 16px)",
    marginBottom: "clamp(32px, 8vw, 48px)",
    fontSize: "clamp(48px, 10vw, 80px)",
    fontWeight: "bold",
  },
  codeChar: { display: "inline-block", color: "#00e5ff" },
  greetingContainer: { marginBottom: "clamp(24px, 6vw, 40px)" },
  greetingText: {
    fontSize: "clamp(18px, 5vw, 28px)",
    fontWeight: "500",
    fontFamily: "monospace",
    wordBreak: "break-word",
  },
  cursor: {
    animation: "blink 1s step-end infinite",
    marginLeft: "2px",
    fontWeight: "300",
  },
  rotatingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "clamp(16px, 4vw, 24px)",
  },
  rotatingText: {
    display: "inline-block",
    padding: "clamp(10px, 3vw, 16px) clamp(16px, 5vw, 24px)",
    borderRadius: "40px",
    fontSize: "clamp(13px, 3.5vw, 16px)",
    fontWeight: "500",
    maxWidth: "90%",
    wordBreak: "break-word",
  },
  loadingContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100dvh",
    backgroundColor: "#071a14",
  },
  loadingContent: { textAlign: "center" },
  codeAnimationLoading: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "20px",
    fontSize: "clamp(36px, 8vw, 56px)",
    fontWeight: "bold",
  },
  codeCharLoading: { display: "inline-block", color: "#00e5ff" },
  loadingText: {
    color: "#00e5ff",
    fontSize: "clamp(14px, 4vw, 18px)",
    marginTop: "20px",
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
    flexWrap: "wrap",
  },
  studyBannerClose: {
    marginLeft: "auto",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
};

const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes floatSoft { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes pulse { 0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); } 30% { opacity: 1; transform: scale(1.2); } }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: rgba(0,0,0,0.05); border-radius: 10px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.3); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,229,255,0.5); }
`;
document.head.appendChild(styleSheet);

export default App;
