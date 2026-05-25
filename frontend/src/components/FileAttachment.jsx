// ============================================
// HERMES AI — Componente FileAttachment
// Upload por clique (clipe) e drag and drop
// Suporta imagens, PDFs, TXT e código fonte
// ============================================

import { useRef, useState } from "react";

// Tipos de arquivo aceitos
const ACCEPTED_TYPES = {
  "image/jpeg": "🖼️",
  "image/png": "🖼️",
  "image/gif": "🖼️",
  "image/webp": "🖼️",
  "application/pdf": "📄",
  "text/plain": "📄",
  "text/javascript": "💻",
  "text/typescript": "💻",
  "text/html": "💻",
  "text/css": "💻",
  "application/json": "💻",
  "text/x-python": "💻",
};

const MAX_SIZE_MB = 50;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const FileAttachment = ({ onFileSelect, isDark, disabled }) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Valida e processa o arquivo selecionado
  const processFile = (file) => {
    if (!file) return;

    // Verifica tipo
    if (!ACCEPTED_TYPES[file.type]) {
      alert(`Tipo de arquivo não suportado: ${file.type}`);
      return;
    }

    // Verifica tamanho
    if (file.size > MAX_SIZE_BYTES) {
      alert(`Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB`);
      return;
    }

    // Lê o arquivo e converte para base64
    const reader = new FileReader();
    reader.onload = (e) => {
      onFileSelect({
        name: file.name,
        type: file.type,
        size: file.size,
        icon: ACCEPTED_TYPES[file.type],
        data: e.target.result, // base64
      }, { merge: true });
    };
    reader.readAsDataURL(file);
  };

  // Clique no botão de clipe
  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
    // Reset input para permitir selecionar o mesmo arquivo novamente
    e.target.value = "";
  };

  // Drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) processFile(e.dataTransfer.files[0]);
  };

  return (
    <>
      {/* Input invisível */}
      <input
        ref={inputRef}
        type="file"
        accept={Object.keys(ACCEPTED_TYPES).join(",")}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Botão clipe */}
      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          ...styles.clipButton,
          color: isDark ? "#7aada0" : "#2a6b5a",
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        aria-label="Anexar arquivo"
        title="Anexar arquivo (máx. 10MB)"
      >
        📎
      </button>

      {/* Overlay de drag and drop — aparece quando arrasta arquivo */}
      {isDragging && (
        <div
          style={{
            ...styles.dropOverlay,
            backgroundColor: isDark
              ? "rgba(7, 26, 20, 0.95)"
              : "rgba(240, 250, 247, 0.95)",
            borderColor: "#00e5ff",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
              Imagens, PDF, TXT, código fonte • Máx. 10MB
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// Listener global de drag — detecta quando arquivo entra na janela
export const useDragDetector = (onDragEnter) => {
  const handleWindowDragOver = (e) => {
    e.preventDefault();
    onDragEnter(true);
  };
  return { handleWindowDragOver };
};

const styles = {
  clipButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "20px",
    padding: "4px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s ease",
    flexShrink: 0,
  },
  dropOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px dashed",
    borderRadius: "12px",
    margin: "16px",
  },
  dropContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  dropIcon: {
    fontSize: "48px",
  },
  dropText: {
    fontSize: "20px",
    fontWeight: "600",
  },
  dropHint: {
    fontSize: "13px",
    color: "#7aada0",
  },
};

export default FileAttachment;


