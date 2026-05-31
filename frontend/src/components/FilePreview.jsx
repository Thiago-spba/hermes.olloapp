// ============================================
// HERMES AI — Componente FilePreview
// Imagem: miniatura real | PDF: card estilizado
// ============================================
const FilePreview = ({ file, onRemove, isDark }) => {
  if (!file) return null;
  const isImage = file.type?.startsWith("image/");
  const isPDF = file.type === "application/pdf";
  const sizeKB = file.size ? (file.size / 1024).toFixed(1) : "—";
  const shortName = file.name?.length > 24 ? file.name.substring(0, 24) + "..." : file.name;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "8px 12px",
      borderRadius: "12px",
      border: `1px solid ${isDark ? "#1a5c3a" : "#7aada0"}`,
      backgroundColor: isDark ? "#0d2e1f" : "#ccede5",
      marginBottom: "8px",
      transition: "all 0.3s ease",
      maxWidth: "320px",
    }}>

      {isImage && (
        <img
          src={file.data}
          alt={file.name}
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "8px",
            objectFit: "cover",
            flexShrink: 0,
            border: `1px solid ${isDark ? "#1a5c3a" : "#7aada0"}`,
          }}
        />
      )}

      {isPDF && (
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "8px",
          backgroundColor: isDark ? "#1a0a0a" : "#fde8e8",
          border: `1px solid ${isDark ? "#5c1a1a" : "#f5a0a0"}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          gap: "1px",
        }}>
          <span style={{ fontSize: "20px", lineHeight: 1 }}>📄</span>
          <span style={{
            fontSize: "8px",
            fontWeight: "700",
            color: isDark ? "#ff6b6b" : "#cc2222",
            letterSpacing: "0.5px",
          }}>PDF</span>
        </div>
      )}

      {!isImage && !isPDF && (
        <span style={{ fontSize: "28px", flexShrink: 0 }}>{file.icon || "📎"}</span>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "3px" }}>
        <span style={{
          fontSize: "12px",
          fontWeight: "600",
          color: isDark ? "#e0f5f0" : "#071a14",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>{shortName}</span>
        <span style={{ fontSize: "10px", color: "#7aada0" }}>
          {isPDF ? `PDF • ${sizeKB} KB` : isImage ? `Imagem • ${sizeKB} KB` : `${sizeKB} KB`}
        </span>
      </div>

      <button
        onClick={onRemove}
        aria-label="Remover arquivo"
        style={{
          backgroundColor: "transparent",
          border: "none",
          fontSize: "14px",
          cursor: "pointer",
          color: isDark ? "#7aada0" : "#2a6b5a",
          padding: "4px 6px",
          borderRadius: "4px",
          flexShrink: 0,
        }}
      >✕</button>
    </div>
  );
};

export default FilePreview;
