import { useState, useEffect, useRef } from "react";
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

  const mainRef = useRef(null);
  const msgRefs = useRef({});
  const scrollToBottom = () => {
    setTimeout(() => {
      const c = mainRef.current;
      if (c) c.scrollTop = c.scrollHeight;
    }, 200);
  };

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

  // ✅ SCROLL: toda vez que uma nova mensagem do usuário aparece,
  // scrolla o container para mostrar essa mensagem no topo
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.role !== "user") return;

    // Pequeno delay para o DOM renderizar
    setTimeout(() => {
      const container = mainRef.current;
      console.log(
        "[SCROLL] container:",
        container,
        "scrollHeight:",
        container?.scrollHeight,
      );
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 150);
  }, [messages.length]);

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
    if (conversationId && messages.length > 1) onMessagesUpdate(messages);
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
      setIsConnected(await checkHealth());
    };
    verifyConnection();
    const interval = setInterval(verifyConnection, 30000);
    return () => clearInterval(interval);
  }, []);

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
    sendUserMessage(
      `Vou te falar sobre meu projeto "${project.name}". ${project.description ? project.description + ". " : ""}${project.context ? "Detalhes: " + project.context : ""}`,
      null,
      null,
    );
  };

  if (authLoading)
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

      <main ref={mainRef} style={styles.main}>
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
      </main>

      <ModelSelector
        selectedModel={selectedModel}
        onModelChange={changeModel}
        isDark={isDark}
      />
      <ChatInput onSend={(text, file, audio) => { sendUserMessage(text, file, audio); setTimeout(() => { const c = mainRef.current; if (c) c.scrollTop = c.scrollHeight; }, 100); }}
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

