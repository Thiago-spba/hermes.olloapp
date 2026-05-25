// ============================================
// HERMES AI — Componente ChatInput
// Com clipe, drag & drop, microfone e preview
// ============================================

import { useState, useRef, useEffect } from "react";
import FileAttachment from "./FileAttachment";
import FilePreview from "./FilePreview";
import AudioRecorder from "./AudioRecorder";
import AudioPreview from "./AudioPreview";

const ChatInput = ({ onSend, isLoading, isDark }) => {
  const [text, setText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedAudio, setAttachedAudio] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);

  // Detecta drag global na janela
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
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Quando áudio fica pronto remove arquivo se houver
  const handleAudioReady = (audio) => {
    setAttachedAudio(audio);
    setAttachedFile(null);
  };

  // Quando arquivo é selecionado remove áudio se houver
  const handleFileSelect = (file) => {
    setAttachedFile(file);
    setAttachedAudio(null);
  };

  const hasContent = text.trim() || attachedFile || attachedAudio;

  return (
    <>
      {/* Overlay drag and drop */}
      {isDragging && (
        <div
          style={{
            ...styles.dropOverlay,
            backgroundColor: isDark
              ? "rgba(7, 26, 20, 0.95)"
              : "rgba(240, 250, 247, 0.95)",
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
            <p style={styles.dropHint}>
              Imagens, PDF, TXT, código fonte, áudio • Máx. 10MB
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          ...styles.container,
          backgroundColor: isDark ? "#0a2218" : "#e0f5ef",
          borderTopColor: isDark ? "#143d2e" : "#b0ddd4",
        }}
      >
        {/* Preview de arquivo */}
        {attachedFile && (
          <FilePreview
            file={attachedFile}
            onRemove={() => setAttachedFile(null)}
            isDark={isDark}
          />
        )}

        {/* Preview de áudio */}
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
            backgroundColor: isDark ? "#0d2e1f" : "#ccede5",
            borderColor: hasContent
              ? "#00e5ff44"
              : isDark
                ? "#143d2e"
                : "#b0ddd4",
          }}
        >
          {/* Botão clipe */}
          <FileAttachment
            onFileSelect={handleFileSelect}
            isDark={isDark}
            disabled={isLoading || !!attachedAudio}
          />

          {/* Botão microfone */}
          <AudioRecorder
            onAudioReady={handleAudioReady}
            isDark={isDark}
            disabled={isLoading || !!attachedFile}
          />

          {/* Campo de texto */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              attachedAudio
                ? "Adicione uma mensagem ao áudio..."
                : attachedFile
                  ? "Adicione uma mensagem ao arquivo..."
                  : "Digite sua mensagem..."
            }
            disabled={isLoading}
            rows={1}
            style={{
              ...styles.textarea,
              color: isDark ? "#e0f5f0" : "#071a14",
              opacity: isLoading ? 0.6 : 1,
            }}
          />

          {/* Botão enviar */}
          <button
            onClick={handleSend}
            disabled={isLoading || !hasContent}
            style={{
              ...styles.sendButton,
              opacity: isLoading || !hasContent ? 0.3 : 1,
              cursor: isLoading || !hasContent ? "not-allowed" : "pointer",
              boxShadow: hasContent
                ? "0 0 10px rgba(0, 229, 255, 0.3)"
                : "none",
            }}
            aria-label="Enviar mensagem"
          >
            {isLoading ? "⏳" : "➤"}
          </button>
        </div>

        <p
          style={{
            ...styles.hint,
            color: isDark ? "#3d6b5e" : "#7aada0",
          }}
        >
          Enter para enviar • Shift+Enter para nova linha
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
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    border: "1px solid",
    borderRadius: "12px",
    padding: "8px 12px",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },
  textarea: {
    flex: 1,
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    fontSize: "16px",
    lineHeight: "1.5",
    resize: "none",
    fontFamily: "inherit",
    transition: "color 0.3s ease",
  },
  sendButton: {
    backgroundColor: "#00e5ff",
    border: "none",
    borderRadius: "8px",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "16px",
    flexShrink: 0,
    transition: "opacity 0.2s ease, box-shadow 0.2s ease",
    color: "#071a14",
    fontWeight: "bold",
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
  dropText: {
    fontSize: "20px",
    fontWeight: "600",
  },
  dropHint: {
    fontSize: "13px",
    color: "#7aada0",
  },
};

export default ChatInput;
