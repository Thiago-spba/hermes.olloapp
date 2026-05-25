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
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showVoices, setShowVoices] = useState(false);
  const [wakeLock, setWakeLock] = useState(false);
  const [rate, setRate] = useState(() =>
    parseFloat(localStorage.getItem("hermes-rate") || "1.1"),
  );
  const [fontSize, setFontSize] = useState(() =>
    parseFloat(localStorage.getItem("hermes-fontsize") || "15"),
  );
  const wakeLockRef = useRef(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    window.hermesRate = rate;
    localStorage.setItem("hermes-rate", rate);
  }, [rate]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${fontSize}px`,
    );
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

  const handleRateChange = (newRate) => {
    setRate(newRate);
    window.hermesRate = newRate;
    localStorage.setItem("hermes-rate", newRate);
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
    bg: isDark ? "#0a2218" : "#e0f5ef",
    border: isDark ? "#143d2e" : "#b0ddd4",
    menuBg: isDark ? "#0d2e1f" : "#ffffff",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    hover: isDark ? "#143d2e" : "#e0f5ef",
  };

  const fontSizes = [
    { label: "P", value: 13 },
    { label: "M", value: 15 },
    { label: "G", value: 17 },
    { label: "GG", value: 19 },
  ];

  const speedOptions = [
    { label: "0.7x", value: 0.7 },
    { label: "1.0x", value: 1.0 },
    { label: "1.2x", value: 1.2 },
    { label: "1.5x", value: 1.5 },
    { label: "2.0x", value: 2.0 },
  ];

  const menuItems = [
    {
      icon: "🧠",
      label: "Base de Conhecimento",
      action: () => {
        onKnowledgeClick?.();
        setMenuOpen(false);
      },
    },
    {
      icon: "📁",
      label: "Meus Projetos",
      action: () => {
        onProjectsClick?.();
        setMenuOpen(false);
      },
    },
    {
      icon: "📋",
      label: "Histórico",
      action: () => {
        onHistoryClick();
        setMenuOpen(false);
      },
    },
    {
      icon: isDark ? "☀️" : "🌙",
      label: isDark ? "Modo Claro" : "Modo Escuro",
      action: () => {
        onToggleTheme();
        setMenuOpen(false);
      },
    },
    {
      icon: "⏻",
      label: "Sair",
      action: () => {
        onLogout();
        setMenuOpen(false);
      },
      danger: true,
    },
  ];

  return (
    <>
      {menuOpen && (
        <div
          onClick={() => {
            setMenuOpen(false);
            setShowVoices(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 98 }}
        />
      )}

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          backgroundColor: c.bg,
          borderBottom: `1px solid ${c.border}`,
          transition: "background-color 0.3s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src="/favicon-96x96.png"
            alt="Hermes"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              objectFit: "cover",
              filter: "drop-shadow(0 0 6px #00e5ff)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.2,
            }}
          >
            <span
              style={{
                fontSize: "16px",
                fontWeight: "700",
                letterSpacing: "2px",
                color: isDark ? "#00e5ff" : "#0099bb",
                textShadow: isDark ? "0 0 8px rgba(0,229,255,0.4)" : "none",
              }}
            >
              HERMES
            </span>
            <span
              style={{ fontSize: "10px", letterSpacing: "1px", color: c.sub }}
            >
              AI Agent
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                backgroundColor: isConnected ? "#00e5aa" : "#ff4455",
                boxShadow: isConnected ? "0 0 6px #00e5aa" : "0 0 6px #ff4455",
              }}
            />
            <span style={{ fontSize: "12px", color: c.sub }}>
              {isConnected ? "Online" : "Offline"}
            </span>
          </div>

          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                style={{
                  backgroundColor: menuOpen ? c.hover : "transparent",
                  border: `1px solid ${c.border}`,
                  borderRadius: "8px",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: "16px",
                      height: "2px",
                      backgroundColor: isDark ? "#00e5ff" : "#0099bb",
                      borderRadius: "2px",
                    }}
                  />
                ))}
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "44px",
                    right: 0,
                    zIndex: 200,
                    backgroundColor: c.menuBg,
                    border: `1px solid ${c.border}`,
                    borderRadius: "12px",
                    minWidth: "220px",
                    overflow: "hidden",
                    boxShadow: isDark
                      ? "0 8px 32px rgba(0,0,0,0.6)"
                      : "0 8px 32px rgba(0,0,0,0.15)",
                  }}
                >
                  {/* Perfil */}
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: `1px solid ${c.border}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          border: "2px solid #00e5ff",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          backgroundColor: isDark ? "#143d2e" : "#ccede5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "700",
                          color: isDark ? "#00e5ff" : "#0099bb",
                          border: "2px solid #00e5ff",
                        }}
                      >
                        {(user.displayName ||
                          user.email ||
                          "U")[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: c.text,
                        }}
                      >
                        {user.displayName || "Usuário"}
                      </span>
                      <span style={{ fontSize: "11px", color: c.sub }}>
                        {user.email}
                      </span>
                    </div>
                  </div>

                  {/* Zoom / Tamanho de fonte */}
                  <div
                    style={{
                      borderBottom: `1px solid ${c.border}`,
                      padding: "10px 16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: c.sub,
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>🔍</span>
                      <span>
                        Tamanho do texto:{" "}
                        <strong style={{ color: c.text }}>{fontSize}px</strong>
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {fontSizes.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setFontSize(opt.value)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            cursor: "pointer",
                            backgroundColor:
                              fontSize === opt.value
                                ? "#00e5ff"
                                : isDark
                                  ? "#071a14"
                                  : "#e0f5ef",
                            border: `1px solid ${fontSize === opt.value ? "#00e5ff" : c.border}`,
                            color: fontSize === opt.value ? "#071a14" : c.sub,
                            fontWeight: fontSize === opt.value ? "700" : "400",
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
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = c.hover)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span>🔊</span>
                        <span>
                          Voz:{" "}
                          {selectedVoice
                            ? selectedVoice.name
                                .split(" ")
                                .slice(0, 2)
                                .join(" ")
                            : "Carregando..."}
                        </span>
                      </span>
                      <span style={{ fontSize: "10px", color: c.sub }}>
                        {showVoices ? "▲" : "▼"}
                      </span>
                    </button>

                    {showVoices && (
                      <div
                        style={{
                          maxHeight: "180px",
                          overflowY: "auto",
                          backgroundColor: isDark ? "#071a14" : "#f5faf8",
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
                              style={{
                                width: "100%",
                                padding: "8px 20px",
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
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  c.hover)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  selectedVoice?.name === v.name
                                    ? isDark
                                      ? "#143d2e"
                                      : "#ccede5"
                                    : "transparent")
                              }
                            >
                              <span>
                                {v.name.split(" ").slice(0, 2).join(" ")}
                              </span>
                              <span style={{ fontSize: "10px", opacity: 0.5 }}>
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
                      borderBottom: `1px solid ${c.border}`,
                      padding: "10px 16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: c.sub,
                        marginBottom: "8px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>⚡</span>
                      <span>
                        Velocidade:{" "}
                        <strong style={{ color: c.text }}>{rate}x</strong>
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}
                    >
                      {speedOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleRateChange(opt.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            cursor: "pointer",
                            backgroundColor:
                              rate === opt.value
                                ? "#00e5ff"
                                : isDark
                                  ? "#071a14"
                                  : "#e0f5ef",
                            border: `1px solid ${rate === opt.value ? "#00e5ff" : c.border}`,
                            color: rate === opt.value ? "#071a14" : c.sub,
                            fontWeight: rate === opt.value ? "700" : "400",
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Manter tela ativa */}
                  <button
                    onClick={toggleWakeLock}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      backgroundColor: wakeLock
                        ? isDark
                          ? "#143d2e"
                          : "#ccede5"
                        : "transparent",
                      border: "none",
                      borderBottom: `1px solid ${c.border}`,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      color: wakeLock
                        ? isDark
                          ? "#00e5aa"
                          : "#007a55"
                        : c.text,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = c.hover)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = wakeLock
                        ? isDark
                          ? "#143d2e"
                          : "#ccede5"
                        : "transparent")
                    }
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span>📱</span>
                      <span>Manter tela ativa</span>
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: wakeLock ? "#00e5aa" : c.sub,
                      }}
                    >
                      {wakeLock ? "ON ●" : "OFF"}
                    </span>
                  </button>

                  {/* Menu items */}
                  {menuItems.map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
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
                        gap: "10px",
                        fontSize: "13px",
                        color: item.danger ? "#ff4455" : c.text,
                        fontWeight: item.danger ? "600" : "400",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = c.hover)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
