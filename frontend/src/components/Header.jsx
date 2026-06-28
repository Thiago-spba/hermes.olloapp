import { useState, useEffect, useRef } from "react";

const Header = ({
  isConnected,
  isDark,
  onToggleTheme,
  user,
  onLogout,
  onHistoryClick,
  onProjectsClick,
  onKnowledgeClick,
  onNotebookClick,
  studyMode, // ✅ ADICIONADO
  onToggleStudyMode, // ✅ ADICIONADO
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showVoices, setShowVoices] = useState(false);
  const [wakeLock, setWakeLock] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const [showStudyCard, setShowStudyCard] = useState(false); // ✅ ADICIONADO
  const [rate, setRate] = useState(() =>
    parseFloat(localStorage.getItem("hermes-rate") || "1.1"),
  );
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem("hermes-fontsize") || "15"));
  const wakeLockRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    window.hermesRate = rate;
    localStorage.setItem("hermes-rate", rate);
  }, [rate]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-size-base", `${fontSize}px`);
    const scale = fontSize / 15;
    const root = document.getElementById("hermes-root");
    if (root) root.style.zoom = scale;
    
    localStorage.setItem("hermes-fontsize", fontSize);
  }, [fontSize]);

  useEffect(() => {
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      if (all.length === 0 || loadedRef.current) return;
      loadedRef.current = true;
      const ptVoices = all.filter((v) => v.lang.startsWith("pt"));
      const list = ptVoices.length > 0 ? ptVoices : all;
      setVoices(list);
      const saved = localStorage.getItem("hermes-voice");
      const found = saved ? all.find((v) => v.name === saved) : null;
      const female = list.find((v) =>
        /female|feminina|francisca|vitoria|luciana/i.test(v.name),
      );
      const chosen = found || female || list[0];
      if (chosen) {
        setSelectedVoice(chosen);
        window.hermesVoice = chosen;
        localStorage.setItem("hermes-voice", chosen.name);
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    setTimeout(load, 500);
    setTimeout(load, 1500);
    setTimeout(load, 3000);
  }, []);

  const handleVoiceSelect = (voice) => {
    setSelectedVoice(voice);
    window.hermesVoice = voice;
    localStorage.setItem("hermes-voice", voice.name);
    setShowVoices(false);
    const u = new SpeechSynthesisUtterance("Olá, sou o Hermes!");
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  const toggleWakeLock = async () => {
    if (wakeLock) {
      try {
        await wakeLockRef.current?.release();
      } catch {}
      wakeLockRef.current = null;
      setWakeLock(false);
    } else {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
        setWakeLock(true);
        wakeLockRef.current.addEventListener("release", () =>
          setWakeLock(false),
        );
      } catch {
        alert("Seu dispositivo não suporta Wake Lock.");
      }
    }
  };

  const c = {
    bg: isDark ? "rgba(7,26,20,0.95)" : "rgba(240,250,247,0.95)",
    border: isDark ? "#143d2e" : "#b0ddd4",
    menuBg: isDark ? "#071a14" : "#ffffff",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    hover: isDark ? "#0d2e1f" : "#e0f5ef",
    accent: "#00e5ff",
    green: "#00e5aa",
  };

  const fontSizes = [
    { label: "P", value: 13 },
    { label: "M", value: 16 },
    { label: "G", value: 20 },
    { label: "GG", value: 24 },
  ];
  const speedOptions = [
    { label: "0.7x", value: 0.7 },
    { label: "1.0x", value: 1.0 },
    { label: "1.2x", value: 1.2 },
    { label: "1.5x", value: 1.5 },
    { label: "2.0x", value: 2.0 },
  ];

  const sections = [
    {
      id: "notebook",
      icon: "\ud83d\udcd3",
      label: "Caderno de Notas",
      action: () => {
        onNotebookClick?.();
        setMenuOpen(false);
      },
    },
    {
      id: "knowledge",
      icon: "🧠",
      label: "Base de Conhecimento",
      action: () => {
        onKnowledgeClick?.();
        setMenuOpen(false);
      },
    },
    {
      id: "projects",
      icon: "📁",
      label: "Meus Projetos",
      action: () => {
        onProjectsClick?.();
        setMenuOpen(false);
      },
    },
    {
      id: "history",
      icon: "📋",
      label: "Histórico",
      action: () => {
        onHistoryClick();
        setMenuOpen(false);
      },
    },
  ];

  return (
    <>
      <style>{`
        @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        .hermes-menu-item:hover { background: ${c.hover} !important; }
        .hermes-voice-item:hover { background: ${c.hover} !important; }
        .hermes-section-btn { transition: all 0.2s ease; }
        .hermes-section-btn:hover { background: ${c.hover} !important; transform: translateX(2px); }
      `}</style>

      {menuOpen && (
        <div
          onClick={() => {
            setMenuOpen(false);
            setShowVoices(false);
            setActiveSection(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 98,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ✅ ADICIONADO: Card de confirmação Modo Estudo */}
      {showStudyCard && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 600,
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
              padding: "28px 24px",
              width: "300px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>💡</div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                  color: isDark ? "#e0f5f0" : "#071a14",
                  marginBottom: "8px",
                }}
              >
                {studyMode ? "Desativar Modo Estudo?" : "Ativar Modo Estudo?"}
              </div>
              {!studyMode && (
                <div
                  style={{
                    fontSize: "12px",
                    color: isDark ? "#7aada0" : "#2a6b5a",
                    lineHeight: 1.6,
                    textAlign: "left",
                    backgroundColor: isDark ? "#071a14" : "#f0faf7",
                    borderRadius: "10px",
                    padding: "12px",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "6px",
                      fontWeight: "600",
                      color: isDark ? "#00e5aa" : "#007a55",
                    }}
                  >
                    Como funciona:
                  </div>
                  <div>
                    📖 <strong>Conceito</strong> — explicação clara e direta
                  </div>
                  <div>
                    💡 <strong>Exemplo</strong> — caso prático do mundo real
                  </div>
                  <div>
                    ✏️ <strong>Exercício</strong> — questão para fixar o
                    conteúdo
                  </div>
                  <div
                    style={{ marginTop: "8px", opacity: 0.7, fontSize: "11px" }}
                  >
                    Ideal para estudar qualquer matéria com profundidade.
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                onClick={() => setShowStudyCard(false)}
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
                onClick={() => {
                  onToggleStudyMode(!studyMode);
                  setShowStudyCard(false);
                  setMenuOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: studyMode ? "#ff4455" : "#00e5aa",
                  border: "none",
                  color: "#071a14",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                {studyMode ? "Desativar" : "Ativar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: c.bg,
          borderBottom: `1px solid ${c.border}`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ position: "relative" }}>
            <img
              src="/favicon-96x96.png"
              alt="Hermes"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                objectFit: "cover",
                filter: `drop-shadow(0 0 8px ${isConnected ? "#00e5ff" : "#ff4455"})`,
                transition: "filter 0.3s ease",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "1px",
                right: "1px",
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: isConnected ? "#00e5aa" : "#ff4455",
                border: `2px solid ${isDark ? "#071a14" : "#f0faf7"}`,
                boxShadow: `0 0 6px ${isConnected ? "#00e5aa" : "#ff4455"}`,
                animation: isConnected ? "none" : "pulse 1.5s infinite",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                fontSize: "15px",
                fontWeight: "800",
                letterSpacing: "3px",
                color: isDark ? "#00e5ff" : "#0099bb",
                textShadow: isDark ? "0 0 12px rgba(0,229,255,0.5)" : "none",
              }}
            >
              HERMES
            </span>
            <span
              style={{
                fontSize: "9px",
                letterSpacing: "1.5px",
                color: c.sub,
                textTransform: "uppercase",
              }}
            >
              AI Agent • {isConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        {/* Menu button */}
        {user && (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                backgroundColor: menuOpen ? c.hover : "transparent",
                border: `1px solid ${menuOpen ? c.accent : c.border}`,
                borderRadius: "10px",
                width: "40px",
                height: "40px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                transition: "all 0.2s ease",
                boxShadow: menuOpen ? `0 0 12px rgba(0,229,255,0.2)` : "none",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: menuOpen ? (i === 1 ? "0px" : "14px") : "16px",
                    height: "2px",
                    backgroundColor: menuOpen
                      ? c.accent
                      : isDark
                        ? "#00e5ff"
                        : "#0099bb",
                    borderRadius: "2px",
                    transform: menuOpen
                      ? i === 0
                        ? "rotate(45deg) translate(5px, 5px)"
                        : i === 2
                          ? "rotate(-45deg) translate(5px, -5px)"
                          : "scaleX(0)"
                      : "none",
                    transition: "all 0.25s ease",
                    transformOrigin: "center",
                  }}
                />
              ))}
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "48px",
                  right: 0,
                  zIndex: 200,
                  backgroundColor: c.menuBg,
                  border: `1px solid ${c.border}`,
                  borderRadius: "16px",
                  width: "260px",
                  overflow: "hidden",
                  boxShadow: isDark
                    ? "0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,255,0.05)"
                    : "0 16px 48px rgba(0,0,0,0.15)",
                  animation: "slideDown 0.2s ease",
                }}
              >
                {/* Perfil */}
                <div
                  style={{
                    padding: "16px",
                    borderBottom: `1px solid ${c.border}`,
                    background: isDark
                      ? "linear-gradient(135deg, #0d2e1f, #071a14)"
                      : "linear-gradient(135deg, #e0f5ef, #f0faf7)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        border: `2px solid ${c.accent}`,
                        boxShadow: "0 0 12px rgba(0,229,255,0.3)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: isDark ? "#143d2e" : "#ccede5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "800",
                        fontSize: "16px",
                        color: isDark ? "#00e5ff" : "#0099bb",
                        border: `2px solid ${c.accent}`,
                        boxShadow: "0 0 12px rgba(0,229,255,0.3)",
                      }}
                    >
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: c.text,
                      }}
                    >
                      {user.displayName || "Usuário"}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: c.sub,
                        marginTop: "2px",
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Ações rápidas */}
                <div
                  style={{
                    padding: "8px",
                    borderBottom: `1px solid ${c.border}`,
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  {sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={s.action}
                      className="hermes-section-btn"
                      style={{
                        flex: 1,
                        padding: "10px 6px",
                        backgroundColor: "transparent",
                        border: `1px solid ${c.border}`,
                        borderRadius: "10px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "18px",
                      }}
                    >
                      <span>{s.icon}</span>
                      <span
                        style={{
                          fontSize: "9px",
                          color: c.sub,
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}
                      >
                        {s.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* ✅ ADICIONADO: Modo Estudo — antes do tamanho de fonte */}
                <button
                  onClick={() => setShowStudyCard(true)}
                  className="hermes-menu-item"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: studyMode
                      ? isDark
                        ? "#0d2e1f"
                        : "#e0f5ef"
                      : "transparent",
                    border: "none",
                    borderBottom: `1px solid ${c.border}`,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    color: studyMode
                      ? isDark
                        ? "#00e5aa"
                        : "#007a55"
                      : c.text,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "18px" }}>💡</span>
                    <span>Modo Estudo</span>
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      backgroundColor: studyMode
                        ? isDark
                          ? "#143d2e"
                          : "#ccede5"
                        : "transparent",
                      color: studyMode ? "#00e5aa" : c.sub,
                      border: studyMode ? "1px solid #00e5aa" : "none",
                    }}
                  >
                    {studyMode ? "ON" : "OFF"}
                  </span>
                </button>

                {/* Tamanho de fonte */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${c.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: c.sub,
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>🔍</span> Texto:{" "}
                    <strong style={{ color: c.text }}>{fontSize}px</strong>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {fontSizes.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setFontSize(opt.value)}
                        style={{
                          flex: 1,
                          padding: "5px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          cursor: "pointer",
                          backgroundColor:
                            fontSize === opt.value
                              ? c.accent
                              : isDark
                                ? "#0d2e1f"
                                : "#e0f5ef",
                          border: `1px solid ${fontSize === opt.value ? c.accent : c.border}`,
                          color: fontSize === opt.value ? "#071a14" : c.sub,
                          fontWeight: fontSize === opt.value ? "700" : "400",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Voz */}
                <div style={{ borderBottom: `1px solid ${c.border}` }}>
                  <button
                    onClick={() => setShowVoices((v) => !v)}
                    className="hermes-menu-item"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      color: c.text,
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>🔊</span>
                      <span style={{ fontSize: "12px" }}>
                        {selectedVoice
                          ? selectedVoice.name.split(" ").slice(0, 2).join(" ")
                          : "Carregando..."}
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: "9px",
                        color: c.sub,
                        transition: "transform 0.2s",
                        display: "inline-block",
                        transform: showVoices ? "rotate(180deg)" : "none",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {showVoices && (
                    <div
                      style={{
                        maxHeight: "160px",
                        overflowY: "auto",
                        backgroundColor: isDark ? "#040f0a" : "#f5faf8",
                      }}
                    >
                      {voices.length === 0 ? (
                        <div
                          style={{
                            padding: "10px 20px",
                            fontSize: "12px",
                            color: c.sub,
                          }}
                        >
                          Nenhuma voz disponível
                        </div>
                      ) : (
                        voices.map((v) => (
                          <button
                            key={v.name}
                            onClick={() => handleVoiceSelect(v)}
                            className="hermes-voice-item"
                            style={{
                              width: "100%",
                              padding: "8px 16px",
                              backgroundColor:
                                selectedVoice?.name === v.name
                                  ? isDark
                                    ? "#143d2e"
                                    : "#ccede5"
                                  : "transparent",
                              border: "none",
                              cursor: "pointer",
                              textAlign: "left",
                              fontSize: "12px",
                              color:
                                selectedVoice?.name === v.name
                                  ? isDark
                                    ? "#00e5ff"
                                    : "#0099bb"
                                  : c.sub,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span>
                              {v.name.split(" ").slice(0, 3).join(" ")}
                            </span>
                            <span
                              style={{
                                fontSize: "9px",
                                opacity: 0.5,
                                backgroundColor: isDark ? "#0d2e1f" : "#e0f5ef",
                                padding: "1px 5px",
                                borderRadius: "4px",
                              }}
                            >
                              {v.lang}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Velocidade */}
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: `1px solid ${c.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: c.sub,
                      marginBottom: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>⚡</span> Velocidade:{" "}
                    <strong style={{ color: c.text }}>{rate}x</strong>
                  </div>
                  <div
                    style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}
                  >
                    {speedOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setRate(opt.value);
                          window.hermesRate = opt.value;
                          localStorage.setItem("hermes-rate", opt.value);
                        }}
                        style={{
                          padding: "4px 8px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          cursor: "pointer",
                          backgroundColor:
                            rate === opt.value
                              ? c.accent
                              : isDark
                                ? "#0d2e1f"
                                : "#e0f5ef",
                          border: `1px solid ${rate === opt.value ? c.accent : c.border}`,
                          color: rate === opt.value ? "#071a14" : c.sub,
                          fontWeight: rate === opt.value ? "700" : "400",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tela ativa */}
                <button
                  onClick={toggleWakeLock}
                  className="hermes-menu-item"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: wakeLock
                      ? isDark
                        ? "#0d2e1f"
                        : "#e0f5ef"
                      : "transparent",
                    border: "none",
                    borderBottom: `1px solid ${c.border}`,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    color: wakeLock ? (isDark ? "#00e5aa" : "#007a55") : c.text,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>📱</span>
                    <span>Manter tela ativa</span>
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      backgroundColor: wakeLock
                        ? isDark
                          ? "#143d2e"
                          : "#ccede5"
                        : "transparent",
                      color: wakeLock ? "#00e5aa" : c.sub,
                      border: wakeLock ? "1px solid #00e5aa" : "none",
                    }}
                  >
                    {wakeLock ? "ON" : "OFF"}
                  </span>
                </button>

                {/* Tema */}
                <button
                  onClick={() => {
                    onToggleTheme();
                    setMenuOpen(false);
                  }}
                  className="hermes-menu-item"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${c.border}`,
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: c.text,
                  }}
                >
                  <span>{isDark ? "☀️" : "🌙"}</span>
                  <span>{isDark ? "Modo Claro" : "Modo Escuro"}</span>
                </button>

                {/* Sair */}
                <button
                  onClick={() => {
                    onLogout();
                    setMenuOpen(false);
                  }}
                  className="hermes-menu-item"
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: "#ff4455",
                    fontWeight: "600",
                  }}
                >
                  <span>⏻</span>
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};

export default Header;








