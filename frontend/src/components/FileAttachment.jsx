// ============================================
// HERMES AI — Componente FileAttachment
// Upload por clique (clipe) e drag and drop
// Suporta imagens, PDFs, TXT e código fonte
// ============================================

import { useRef, useState } from "react";

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

const MAX_SIZE_MB = 200;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const MAX_IMAGES = 5;

const readAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const FileAttachment = ({
  onFileSelect,
  isDark,
  disabled,
  showLabel = false,
}) => {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Aceita varias imagens de uma vez (ate MAX_IMAGES); qualquer outro tipo
  // (PDF, texto, codigo) continua sendo tratado como anexo unico
  const processFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => ACCEPTED_TYPES[f.type]);
    if (!files.length) {
      if (fileList?.length) alert("Tipo de arquivo não suportado.");
      return;
    }
    const oversized = files.find((f) => f.size > MAX_SIZE_BYTES);
    if (oversized) {
      alert(`Arquivo muito grande. Máximo: ${MAX_SIZE_MB}MB`);
      return;
    }

    const allImages = files.every((f) => f.type.startsWith("image/"));

    if (allImages && files.length > 1) {
      const limited = files.slice(0, MAX_IMAGES);
      if (files.length > MAX_IMAGES) {
        alert(`Maximo de ${MAX_IMAGES} imagens por vez. Usando as primeiras ${MAX_IMAGES}.`);
      }
      const loaded = await Promise.all(
        limited.map(async (file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          icon: ACCEPTED_TYPES[file.type],
          data: await readAsDataURL(file),
        }))
      );
      onFileSelect(loaded);
      return;
    }

    const file = files[0];
    const data = await readAsDataURL(file);
    onFileSelect([
      {
        name: file.name,
        type: file.type,
        size: file.size,
        icon: ACCEPTED_TYPES[file.type],
        data,
      },
    ]);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleFileChange = (e) => {
    processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) processFiles(e.dataTransfer.files);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={Object.keys(ACCEPTED_TYPES).join(",")}
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      <button
        onClick={handleClick}
        disabled={disabled}
        style={{
          backgroundColor: "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          padding: showLabel ? "6px 8px" : "4px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: showLabel ? "8px" : "0px",
          width: showLabel ? "100%" : "auto",
          color: isDark ? "#7aada0" : "#2a6b5a",
          transition: "opacity 0.2s ease",
          flexShrink: 0,
        }}
        aria-label="Anexar arquivo"
        title="Anexar arquivo"
      >
        {/* Ícone SVG de clipe simples */}
        <svg
          width={showLabel ? "18" : "20"}
          height={showLabel ? "18" : "20"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
        {showLabel && (
          <span
            style={{ fontSize: "13px", color: isDark ? "#e0f5f0" : "#071a14" }}
          >
            Anexar arquivo
          </span>
        )}
      </button>

      {isDragging && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed #00e5ff",
            borderRadius: "12px",
            margin: "16px",
            backgroundColor: isDark
              ? "rgba(7,26,20,0.95)"
              : "rgba(240,250,247,0.95)",
            borderColor: "#00e5ff",
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "48px" }}>📂</span>
            <p
              style={{
                fontSize: "20px",
                fontWeight: "600",
                color: isDark ? "#e0f5f0" : "#071a14",
              }}
            >
              Solte o arquivo aqui
            </p>
            <p style={{ fontSize: "13px", color: "#7aada0" }}>
              Imagens, PDF, TXT, código fonte • Máx. 200MB
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export const useDragDetector = (onDragEnter) => {
  const handleWindowDragOver = (e) => {
    e.preventDefault();
    onDragEnter(true);
  };
  return { handleWindowDragOver };
};

export default FileAttachment;
