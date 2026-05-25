// ============================================
// HERMES AI — Componente FilePreview
// Mostra preview do arquivo antes de enviar
// ============================================

const FilePreview = ({ file, onRemove, isDark }) => {
  if (!file) return null;

  const isImage = file.type.startsWith("image/");

  return (
    <div
      style={{
        ...styles.container,
        backgroundColor: isDark ? "#0d2e1f" : "#ccede5",
        borderColor: isDark ? "#1a5c3a" : "#7aada0",
      }}
    >
      {/* Preview da imagem ou ícone do arquivo */}
      {isImage ? (
        <img src={file.data} alt={file.name} style={styles.imagePreview} />
      ) : (
        <span style={styles.fileIcon}>{file.icon}</span>
      )}

      {/* Nome e tamanho do arquivo */}
      <div style={styles.fileInfo}>
        <span
          style={{
            ...styles.fileName,
            color: isDark ? "#e0f5f0" : "#071a14",
          }}
        >
          {file.name.length > 20
            ? file.name.substring(0, 20) + "..."
            : file.name}
        </span>
        <span style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</span>
      </div>

      {/* Botão remover */}
      <button
        onClick={onRemove}
        style={{
          ...styles.removeButton,
          color: isDark ? "#7aada0" : "#2a6b5a",
        }}
        aria-label="Remover arquivo"
      >
        ✕
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    borderRadius: "8px",
    border: "1px solid",
    marginBottom: "8px",
    transition: "background-color 0.3s ease, border-color 0.3s ease",
  },
  imagePreview: {
    width: "32px",
    height: "32px",
    borderRadius: "4px",
    objectFit: "cover",
    flexShrink: 0,
  },
  fileIcon: {
    fontSize: "24px",
    flexShrink: 0,
  },
  fileInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  fileName: {
    fontSize: "12px",
    fontWeight: "500",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    transition: "color 0.3s ease",
  },
  fileSize: {
    fontSize: "10px",
    color: "#7aada0",
  },
  removeButton: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "4px",
    flexShrink: 0,
    transition: "color 0.2s ease",
  },
};

export default FilePreview;

