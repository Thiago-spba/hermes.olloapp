import { useState } from "react";
import { auth } from "../services/firebase";
import { EmailAuthProvider, linkWithCredential } from "firebase/auth";

const PinSetup = ({ user, onComplete, isDark }) => {
  const [step, setStep] = useState("welcome");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validatePin = (value) => {
    const hasNumbers = (value.match(/\d/g) || []).length >= 5;
    const hasLetters = (value.match(/[a-zA-Z]/g) || []).length >= 3;
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
    return hasNumbers && hasLetters && hasSpecial;
  };

  const getPinStrength = (value) => {
    if (!value) return { label: "", color: "transparent" };
    const hasNumbers = (value.match(/\d/g) || []).length >= 5;
    const hasLetters = (value.match(/[a-zA-Z]/g) || []).length >= 3;
    const hasSpecial = /[!@#$%^&*]/.test(value);
    const count = [hasNumbers, hasLetters, hasSpecial].filter(Boolean).length;
    if (count === 1) return { label: "Fraco", color: "#ff4455" };
    if (count === 2) return { label: "Medio", color: "#ffaa00" };
    return { label: "Forte", color: "#00e5aa" };
  };

  const handleCreatePin = async () => {
    setError("");
    if (!validatePin(pin)) {
      setError(
        "PIN precisa ter: minimo 5 numeros, 3 letras e 1 caractere especial (!@#$%^&*)",
      );
      return;
    }
    if (pin !== confirmPin) {
      setError("Os PINs nao conferem.");
      return;
    }
    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, pin);
      await linkWithCredential(auth.currentUser, credential);
      localStorage.setItem("hermes-pin-setup-" + user.uid, "done");
      setStep("success");
    } catch (err) {
      if (err.code === "auth/provider-already-linked") {
        setError("Conta ja possui senha vinculada.");
      } else {
        setError("Erro ao salvar PIN: " + err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("hermes-pin-setup-" + user.uid, "skipped");
    onComplete();
  };

  const strength = getPinStrength(pin);

  const c = {
    bg: isDark ? "rgba(7,26,20,0.85)" : "rgba(240,250,247,0.85)",
    card: isDark ? "#0a2218" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    inputBg: isDark ? "#0d2e1f" : "#f5faf8",
    inputBorder: isDark ? "#1a5c3a" : "#b0ddd4",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: c.bg,
        backdropFilter: "blur(8px)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          backgroundColor: c.card,
          border: "1px solid " + c.border,
          borderRadius: "18px",
          padding: "28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: isDark
            ? "0 0 40px rgba(0,229,255,0.1), 0 8px 32px rgba(0,0,0,0.6)"
            : "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        {step === "welcome" && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "8px" }}>👋</div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: isDark ? "#00e5ff" : "#0099bb",
                }}
              >
                Ola,{" "}
                {user.displayName ? user.displayName.split(" ")[0] : "usuario"}!
              </h2>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "13px",
                  color: c.sub,
                  lineHeight: 1.5,
                }}
              >
                Bem-vindo ao Hermes AI. Voce entrou pelo Google com sucesso!
              </p>
            </div>
            <div
              style={{
                backgroundColor: isDark ? "#071a14" : "#f0faf7",
                borderRadius: "10px",
                padding: "14px",
                border: "1px solid " + c.border,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "13px",
                  color: c.sub,
                  lineHeight: 1.6,
                }}
              >
                Quer criar um PIN de acesso para entrar sem precisar do Google?
                E opcional e voce decide qual prefere usar.
              </p>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <button
                onClick={() => setStep("create")}
                style={{
                  backgroundColor: "#00e5ff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#071a14",
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(0,229,255,0.3)",
                }}
              >
                Criar meu PIN
              </button>
              <button
                onClick={handleSkip}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid " + c.border,
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "13px",
                  color: c.sub,
                  cursor: "pointer",
                }}
              >
                Continuar so com Google
              </button>
            </div>
          </>
        )}

        {step === "create" && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔐</div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "17px",
                  fontWeight: "700",
                  color: isDark ? "#00e5ff" : "#0099bb",
                }}
              >
                Criar PIN de acesso
              </h2>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: c.sub }}>
                Minimo: 5 numeros + 3 letras + 1 especial
              </p>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: c.sub,
                }}
              >
                PIN
              </label>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                <input
                  type={showPin ? "text" : "password"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Ex: 12345abc!"
                  style={{
                    flex: 1,
                    border: "1px solid " + c.inputBorder,
                    borderRadius: "8px",
                    padding: "10px 12px",
                    fontSize: "16px",
                    outline: "none",
                    backgroundColor: c.inputBg,
                    color: c.text,
                    fontFamily: "inherit",
                  }}
                />
                <button
                  onClick={() => setShowPin((p) => !p)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    fontSize: "18px",
                    cursor: "pointer",
                    color: c.sub,
                  }}
                >
                  {showPin ? "🙈" : "👁️"}
                </button>
              </div>
              {pin && (
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: "3px",
                      borderRadius: "2px",
                      backgroundColor: isDark ? "#143d2e" : "#e0f0ea",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: "2px",
                        backgroundColor: strength.color,
                        width:
                          strength.label === "Fraco"
                            ? "33%"
                            : strength.label === "Medio"
                              ? "66%"
                              : "100%",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      color: strength.color,
                      fontWeight: "600",
                    }}
                  >
                    {strength.label}
                  </span>
                </div>
              )}
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "5px" }}
            >
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: c.sub,
                }}
              >
                Confirmar PIN
              </label>
              <input
                type={showPin ? "text" : "password"}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Repita o PIN"
                style={{
                  border:
                    "1px solid " +
                    (confirmPin && confirmPin !== pin
                      ? "#ff4455"
                      : c.inputBorder),
                  borderRadius: "8px",
                  padding: "10px 12px",
                  fontSize: "16px",
                  outline: "none",
                  backgroundColor: c.inputBg,
                  color: c.text,
                  fontFamily: "inherit",
                }}
              />
              {confirmPin && confirmPin === pin && (
                <span style={{ fontSize: "11px", color: "#00e5aa" }}>
                  PINs conferem
                </span>
              )}
            </div>
            {error && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#ff4455",
                  textAlign: "center",
                  margin: 0,
                }}
              >
                {error}
              </p>
            )}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <button
                onClick={handleCreatePin}
                disabled={isLoading}
                style={{
                  backgroundColor: "#00e5ff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "14px",
                  fontWeight: "700",
                  color: "#071a14",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  boxShadow: "0 0 16px rgba(0,229,255,0.3)",
                }}
              >
                {isLoading ? "Salvando..." : "Salvar PIN"}
              </button>
              <button
                onClick={handleSkip}
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid " + c.border,
                  borderRadius: "10px",
                  padding: "13px",
                  fontSize: "13px",
                  color: c.sub,
                  cursor: "pointer",
                }}
              >
                Pular por agora
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "8px" }}>🎉</div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                  color: isDark ? "#00e5ff" : "#0099bb",
                }}
              >
                PIN criado com sucesso!
              </h2>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: "13px",
                  color: c.sub,
                  lineHeight: 1.5,
                }}
              >
                Agora voce pode entrar com seu e-mail e PIN, ou continuar usando
                o Google.
              </p>
            </div>
            <button
              onClick={onComplete}
              style={{
                backgroundColor: "#00e5ff",
                border: "none",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: "700",
                color: "#071a14",
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(0,229,255,0.3)",
              }}
            >
              Ir para o Hermes
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PinSetup;

