import { useState, useEffect, useRef } from "react";
import { auth, googleProvider } from "../services/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

const Login = ({ onLogin, isDark, onToggleTheme }) => {
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const fontSize = 14;
    let drops = [];
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drops = Array(Math.floor(canvas.width / fontSize)).fill(1);
    };
    resize();
    const chars = "アイウエオカキクケコ01サシスセソタチ10ツテトナニヌネノ";
    const draw = () => {
      ctx.fillStyle = isDark ? "rgba(7,26,20,0.05)" : "rgba(240,250,247,0.05)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < drops.length; i++) {
        ctx.fillStyle =
          Math.random() > 0.95
            ? "#ffffff"
            : i % 3 === 0
              ? "#00e5ff"
              : "#00aa88";
        ctx.font = fontSize + "px monospace";
        ctx.fillText(
          chars[Math.floor(Math.random() * chars.length)],
          i * fontSize,
          drops[i] * fontSize,
        );
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975)
          drops[i] = 0;
        drops[i]++;
      }
    };
    const interval = setInterval(draw, 50);
    window.addEventListener("resize", resize);
    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, [isDark]);

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user);
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Erro ao entrar com Google: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("E-mail e senha obrigatorios.");
      return;
    }
    if (password.length < 6) {
      setError("Senha deve ter no minimo 6 caracteres.");
      return;
    }
    setIsLoading(true);
    try {
      const result = isFirstAccess
        ? await createUserWithEmailAndPassword(auth, email.trim(), password)
        : await signInWithEmailAndPassword(auth, email.trim(), password);
      onLogin(result.user);
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "Usuario nao encontrado.",
        "auth/wrong-password": "Senha incorreta.",
        "auth/email-already-in-use": "E-mail ja cadastrado.",
        "auth/invalid-email": "E-mail invalido.",
        "auth/invalid-credential": "Credenciais invalidas.",
      };
      setError(msgs[err.code] || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const c = {
    cardBg: isDark ? "rgba(10,34,24,0.93)" : "rgba(255,255,255,0.93)",
    cardBorder: isDark ? "#143d2e" : "#b0ddd4",
    inputBg: isDark ? "#0d2e1f" : "#ffffff",
    inputColor: isDark ? "#e0f5f0" : "#071a14",
    inputBorder: isDark ? "#1a5c3a" : "#b0ddd4",
    label: isDark ? "#7aada0" : "#2a6b5a",
    toggleBarBg: isDark ? "#071a14" : "#e0f5ef",
    googleBg: isDark ? "#0d2e1f" : "#ffffff",
    googleColor: isDark ? "#e0f5f0" : "#071a14",
    divider: isDark ? "#143d2e" : "#b0ddd4",
    dividerText: isDark ? "#3d6b5e" : "#7aada0",
    footer: isDark ? "#3d6b5e" : "#7aada0",
    title: isDark ? "#00e5ff" : "#0099bb",
    subtitle: isDark ? "#7aada0" : "#2a6b5a",
  };

  const inputStyle = {
    border: `1px solid ${c.inputBorder}`,
    borderRadius: "8px",
    padding: "11px 14px",
    fontSize: "16px",
    outline: "none",
    width: "100%",
    fontFamily: "inherit",
    backgroundColor: c.inputBg,
    color: c.inputColor,
    boxSizing: "border-box",
    transition: "border-color 0.2s ease",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflowY: "auto",
        padding: "16px",
        backgroundColor: isDark ? "#071a14" : "#f0faf7",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          backgroundColor: isDark
            ? "rgba(7,26,20,0.72)"
            : "rgba(240,250,247,0.72)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: "420px",
          padding: "clamp(24px,5vw,40px) clamp(20px,5vw,36px)",
          borderRadius: "18px",
          border: `1px solid ${c.cardBorder}`,
          backgroundColor: c.cardBg,
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          boxShadow: isDark
            ? "0 0 40px rgba(0,229,255,0.1), 0 8px 32px rgba(0,0,0,0.6)"
            : "0 0 40px rgba(0,153,187,0.08), 0 8px 32px rgba(0,0,0,0.12)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            paddingBottom: "4px",
          }}
        >
          <img
            src="/favicon-96x96.png"
            alt="Hermes"
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              border: "2px solid #00e5ff",
              boxShadow: "0 0 20px rgba(0,229,255,0.4)",
            }}
          />
          <h1
            style={{
              fontSize: "clamp(20px,5vw,26px)",
              fontWeight: "800",
              letterSpacing: "5px",
              margin: 0,
              color: c.title,
              textShadow: isDark ? "0 0 14px rgba(0,229,255,0.5)" : "none",
            }}
          >
            HERMES
          </h1>
          <p
            style={{
              fontSize: "12px",
              letterSpacing: "1px",
              margin: 0,
              color: c.subtitle,
              textAlign: "center",
              fontStyle: "italic",
              lineHeight: 1.5,
            }}
          >
            Inteligência sem limites. Segurança sem fronteiras.
          </p>
        </div>

        {/* Toggle */}
        <div
          style={{
            display: "flex",
            borderRadius: "10px",
            border: `1px solid ${c.cardBorder}`,
            padding: "3px",
            gap: "3px",
            backgroundColor: c.toggleBarBg,
          }}
        >
          {["Entrar", "Primeiro Acesso"].map((label, i) => {
            const active = i === 0 ? !isFirstAccess : isFirstAccess;
            return (
              <button
                key={label}
                onClick={() => {
                  setIsFirstAccess(i === 1);
                  setError("");
                }}
                style={{
                  flex: 1,
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: active ? "#00e5ff" : "transparent",
                  color: active ? "#071a14" : c.label,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            border: `1px solid ${c.cardBorder}`,
            borderRadius: "10px",
            padding: "12px",
            fontSize: "14px",
            fontWeight: "600",
            width: "100%",
            cursor: isLoading ? "not-allowed" : "pointer",
            backgroundColor: c.googleBg,
            color: c.googleColor,
            opacity: isLoading ? 0.7 : 1,
            transition: "all 0.2s ease",
          }}
        >
          <img
            src="https://www.google.com/favicon.ico"
            alt="G"
            style={{ width: "18px", height: "18px" }}
          />
          Entrar com Google
        </button>

        {/* Divisor */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: c.divider }} />
          <span style={{ fontSize: "11px", color: c.dividerText }}>ou</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: c.divider }} />
        </div>

        {/* E-mail */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: c.label,
            }}
          >
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
            placeholder="seu@email.com"
            autoComplete="email"
            style={inputStyle}
          />
        </div>

        {/* Senha */}
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <label
            style={{
              fontSize: "11px",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: c.label,
            }}
          >
            Senha
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
              placeholder="••••••••"
              autoComplete={isFirstAccess ? "new-password" : "current-password"}
              style={{ ...inputStyle, flex: 1, width: "auto" }}
            />
            <button
              onClick={() => setShowPass((p) => !p)}
              tabIndex={-1}
              style={{
                backgroundColor: "transparent",
                border: "none",
                fontSize: "20px",
                cursor: "pointer",
                padding: "4px",
                flexShrink: 0,
                color: c.label,
              }}
            >
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {error && (
          <p
            style={{
              fontSize: "12px",
              color: "#ff4455",
              textAlign: "center",
              margin: 0,
              padding: "6px 0",
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={handleEmailLogin}
          disabled={isLoading}
          style={{
            backgroundColor: "#00e5ff",
            border: "none",
            borderRadius: "10px",
            padding: "14px",
            fontSize: "15px",
            fontWeight: "700",
            color: "#071a14",
            width: "100%",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading ? 0.7 : 1,
            boxShadow: "0 0 18px rgba(0,229,255,0.35)",
            letterSpacing: "1px",
            transition: "opacity 0.2s ease",
            marginTop: "4px",
          }}
        >
          {isLoading
            ? "⏳ Entrando..."
            : isFirstAccess
              ? "✅ Criar Conta"
              : "➤ Entrar"}
        </button>

        <p
          style={{
            fontSize: "10px",
            margin: 0,
            letterSpacing: "1px",
            color: c.footer,
            textAlign: "center",
          }}
        >
          hermes.olloapp.com.br
        </p>
      </div>
    </div>
  );
};

export default Login;
