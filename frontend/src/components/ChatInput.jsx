import { useState, useRef, useEffect } from "react";
import FileAttachment from "./FileAttachment";
import FilePreview from "./FilePreview";
import AudioRecorder from "./AudioRecorder";
import AudioPreview from "./AudioPreview";

const Heartbeat = ({ isDark }) => {
  const points = "0,20 6,20 9,5 12,35 15,20 18,20 21,12 24,28 27,20 60,20";
  return (
    <svg
      width="60"
      height="40"
      viewBox="0 0 60 40"
      style={{ display: "block" }}
    >
      <polyline
        points={points}
        fill="none"
        stroke={isDark ? "#00e5ff" : "#00c896"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 120,
          strokeDashoffset: 120,
          animation: "heartbeat 1.2s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes heartbeat {
          0% { stroke-dashoffset: 120; opacity: 0.3; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -120; opacity: 0.3; }
        }
      `}</style>
    </svg>
  );
};

const ChatInput = ({ onSend, isLoading, isDark }) => {
  const [text, setText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedAudio, setAttachedAudio] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      if (!isLoading) setIsDragging(true);
    };
    const handleDragLeave = (e) => {
      if (!e.relatedTarget) setIsDragging(false);
    };
    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);
    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [isLoading]);

  const adjustHeight = (el) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  const handleChange = (e) => {
    setText(e.target.value);
    adjustHeight(e.target);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && !attachedFile && !attachedAudio) || isLoading) return;
    onSend(trimmed, attachedFile, attachedAudio);
    setText("");
    setAttachedFile(null);
    setAttachedAudio(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleAudioReady = (audio) => {
    setAttachedAudio(audio);
    setAttachedFile(null);
  };
  const handleFileSelect = (file) => {
    setAttachedFile(file);
    setAttachedAudio(null);
  };
  const hasContent = text.trim() || attachedFile || attachedAudio;

  return (
    <>
      {isDragging && (
        <div
          style={{
            ...styles.dropOverlay,
            backgroundColor: isDark
              ? "rgba(7,26,20,0.95)"
              : "rgba(240,250,247,0.95)",
          }}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev) => {
                setAttachedFile({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  icon: "📄",
                  data: ev.target.result,
                });
                setAttachedAudio(null);
              };
              reader.readAsDataURL(file);
            }
            setIsDragging(false);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <div style={styles.dropContent}>
            <span style={styles.dropIcon}>📂</span>
            <p
              style={{
                ...styles.dropText,
                color: isDark ? "#e0f5f0" : "#071a14",
              }}
            >
              Solte o arquivo aqui
            </p>
            <p style={styles.dropHint}>Imagens, PDF, TXT, código • Max. 50MB</p>
          </div>
        </div>
      )}

      <div
        style={{
          ...styles.container,
          backgroundColor: isDark ? "#0a2218" : "#e8f5f0",
          borderTopColor: isDark ? "#143d2e" : "#b0ddd4",
        }}
      >
        {attachedFile && (
          <FilePreview
            file={attachedFile}
            onRemove={() => setAttachedFile(null)}
            isDark={isDark}
          />
        )}
        {attachedAudio && (
          <AudioPreview
            audio={attachedAudio}
            onRemove={() => setAttachedAudio(null)}
            isDark={isDark}
          />
        )}

        <div
          style={{
            ...styles.inputWrapper,
            backgroundColor: isDark ? "#0d2e1f" : "#ffffff",
            borderColor: isLoading
              ? isDark
                ? "#00e5ff44"
                : "#00c89644"
              : hasContent
                ? "#00e5ff55"
                : isDark
                  ? "#1a4a30"
                  : "#c0ddd4",
            boxShadow: isLoading
              ? `0 0 0 1px ${isDark ? "#00e5ff22" : "#00c89622"}, 0 0 20px ${isDark ? "rgba(0,229,255,0.15)" : "rgba(0,200,150,0.15)"}`
              : hasContent
                ? isDark
                  ? "0 0 0 1px #00e5ff22, inset 0 1px 3px rgba(0,0,0,0.2)"
                  : "0 0 0 1px #00e5ff33"
                : isDark
                  ? "inset 0 1px 3px rgba(0,0,0,0.2)"
                  : "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ position: "relative" }}>
            <FileAttachment
              onFileSelect={handleFileSelect}
              isDark={isDark}
              disabled={isLoading || !!attachedAudio}
            />
          </div>
          <div style={{ position: "relative" }}>
            <AudioRecorder
              onAudioReady={handleAudioReady}
              isDark={isDark}
              disabled={isLoading || !!attachedFile}
            />
          </div>

          {isLoading ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                paddingLeft: "4px",
              }}
            >
              <Heartbeat isDark={isDark} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
                onPaste={(e) => {
                  const items = e.clipboardData?.items;
                  if (!items) return;
                  for (const item of items) {
                    if (item.type.startsWith("image/")) {
                      e.preventDefault();
                      const file = item.getAsFile();
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setAttachedFile({ name: "imagem_colada.png", type: file.type, size: file.size, icon: "🖼️", data: ev.target.result });
                        setAttachedAudio(null);
                      };
                      reader.readAsDataURL(file);
                      break;
                    }
                  }
                }}
              placeholder={
                attachedAudio
                  ? "Adicione contexto ao audio..."
                  : attachedFile
                    ? "Pergunte sobre o arquivo..."
                    : "Digite sua mensagem..."
              }
              disabled={isLoading}
              rows={1}
              style={{
                ...styles.textarea,
                color: isDark ? "#e0f5f0" : "#071a14",
              }}
            />
          )}

          <button
            onClick={handleSend}
            disabled={isLoading || !hasContent}
            style={{
              ...styles.sendButton,
              background:
                isLoading || !hasContent
                  ? isDark
                    ? "#1a3a28"
                    : "#c0ddd4"
                  : "linear-gradient(135deg, #00e5ff 0%, #00c896 50%, #00e5aa 100%)",
              opacity: isLoading || !hasContent ? 0.5 : 1,
              cursor: isLoading || !hasContent ? "not-allowed" : "pointer",
              boxShadow: hasContent
                ? "0 2px 12px rgba(0,229,170,0.4), 0 0 20px rgba(0,229,255,0.2)"
                : "none",
              transform: hasContent ? "scale(1)" : "scale(0.95)",
            }}
            aria-label="Enviar mensagem"
          >
            {isLoading ? (
              <span style={{ fontSize: "14px" }}>⏳</span>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M14 8L2 2l2.5 6L2 14l12-6z"
                  fill="#071a14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        <p style={{ ...styles.hint, color: isDark ? "#3d6b5e" : "#7aada0" }}>
          {isLoading
            ? "Hermes esta pensando..."
            : "Enter para enviar • Shift+Enter para nova linha"}
        </p>
      </div>
    </>
  );
};

const styles = {
  container: {
    padding: "12px 16px",
    borderTop: "1px solid",
    position: "sticky",
    bottom: 0,
    transition: "background-color 0.3s ease",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    border: "1px solid",
    borderRadius: "14px",
    padding: "8px 10px",
    transition: "all 0.3s ease",
    minHeight: "54px",
  },
  textarea: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    fontSize: "15px",
    lineHeight: "1.5",
    resize: "none",
    fontFamily: "inherit",
    transition: "color 0.3s ease",
    padding: "2px 4px",
  },
  sendButton: {
    border: "none",
    borderRadius: "10px",
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.2s ease",
  },
  hint: {
    fontSize: "10px",
    marginTop: "6px",
    textAlign: "center",
    transition: "color 0.3s ease",
  },
  dropOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px dashed #00e5ff",
    borderRadius: "12px",
    margin: "16px",
  },
  dropContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    pointerEvents: "none",
  },
  dropIcon: { fontSize: "48px" },
  dropText: { fontSize: "20px", fontWeight: "600" },
  dropHint: { fontSize: "13px", color: "#7aada0" },
};

export default ChatInput;
