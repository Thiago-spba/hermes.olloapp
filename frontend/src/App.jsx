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
import useChat from "./hooks/useChat";
import useConversation from "./hooks/useConversation";
import { checkHealth } from "./services/api";

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const bottomRef = useRef(null);
  const messagesEndRef = useRef(null);

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
  } = useChat();

  // ============================================
  // AUTO-SCROLL PARA A PERGUNTA ATUAL (QUE VOCÊ FEZ)
  // ============================================
  const scrollToCurrentQuestion = useCallback(() => {
    // Encontra a última mensagem do usuário pelo texto no state
    const lastUserMessageObj = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (!lastUserMessageObj) return;

    // Procura o elemento que contém o texto da pergunta
    const allTextElements = document.querySelectorAll(".hermes-md");
    for (const el of allTextElements) {
      if (
        el.textContent.includes(lastUserMessageObj.content.substring(0, 100))
      ) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }

    // Fallback: scroll para o último elemento de mensagem do usuário
    const allBubbles = document.querySelectorAll('[style*="flex-end"]');
    const lastUserBubble = allBubbles[allBubbles.length - 1];
    if (lastUserBubble) {
      lastUserBubble.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages]);

  // Scroll quando UMA NOVA MENSAGEM é adicionada
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToCurrentQuestion();
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToCurrentQuestion]);

  // Scroll inicial quando o chat carrega
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToCurrentQuestion();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToCurrentQuestion]);

  // ============================================
  // AUTH E TEMAS
  // ============================================
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
    if (conversationId && messages.length > 1) {
      onMessagesUpdate(messages);
    }
  }, [conversationId, messages, onMessagesUpdate]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.remove("light");
    else root.classList.add("light");
    localStorage.setItem("hermes-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  useEffect(() => {
    const verifyConnection = async () => {
      const status = await checkHealth();
      setIsConnected(status);
    };
    verifyConnection();
    const interval = setInterval(verifyConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = async () => {
    await signOut(auth);
    clearChat();
  };

  const handleHistoryClick = async () => {
    await loadHistory();
    setShowHistory(true);
  };

  const handleSelectConversation = (conv) => {
    resumeConversation(conv.id);
    if (conv.messages?.length > 0) loadMessages(conv.messages);
    setShowHistory(false);
  };

  const handleNewConversation = async () => {
    await finishAndStartNew(messages);
    clearChat();
    setShowHistory(false);
  };

  const handleSelectProject = (project) => {
    const contextMessage = `Vou te falar sobre meu projeto "${project.name}". ${project.description ? project.description + ". " : ""}${project.context ? "Detalhes: " + project.context : ""}`;
    sendUserMessage(contextMessage, null, null);
  };

  // ============================================
  // LOADING
  // ============================================
  if (authLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100dvh",
          backgroundColor: isDark ? "#071a14" : "#f0faf7",
          color: "#00e5ff",
          fontSize: "48px",
        }}
      >
        ⚡
      </div>
    );
  }

  if (!user) {
    return (
      <Login onLogin={setUser} isDark={isDark} onToggleTheme={toggleTheme} />
    );
  }

  // ============================================
  // RENDER
  // ============================================
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
          onDelete={(id) => removeConversation(id)}
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
      />

      <main style={styles.main}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} isDark={isDark} />
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
              <span style={{ ...styles.typingDot, animationDelay: "0ms" }} />
              <span style={{ ...styles.typingDot, animationDelay: "200ms" }} />
              <span style={{ ...styles.typingDot, animationDelay: "400ms" }} />
            </div>
          </div>
        )}

        {messages.length > 1 && (
          <button
            onClick={handleNewConversation}
            style={{
              ...styles.clearButton,
              borderColor: isDark ? "#143d2e" : "#b0ddd4",
              color: isDark ? "#3d6b5e" : "#7aada0",
            }}
          >
            Nova conversa
          </button>
        )}

        <div ref={messagesEndRef} />
      </main>

      <ModelSelector
        selectedModel={selectedModel}
        onModelChange={changeModel}
        isDark={isDark}
      />
      <ChatInput
        onSend={sendUserMessage}
        isLoading={isLoading}
        isDark={isDark}
      />
    </div>
  );
};

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
};

export default App;
