import { useState, useRef, useEffect, useCallback } from "react";
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

// ============ CAMERA MODAL ============
const CameraModal = ({ onCapture, onClose, isDark }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [flash, setFlash] = useState(false);
  const [preview, setPreview] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [error, setError] = useState(null);
  const [torch, setTorch] = useState(false);
  const [gridOn, setGridOn] = useState(false);

  const startCamera = useCallback(async (facing) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setError(null);
    } catch (e) {
      setError("Câmera não disponível ou permissão negada.");
    }
  }, []);

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setHasMultipleCameras(videoDevices.length > 1);
      })
      .catch(() => {});
    startCamera(facingMode);
    return () => {
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    setTorch(false);
    startCamera(next);
  };

  const toggleTorch = async () => {
    try {
      const track = streamRef.current?.getVideoTracks()[0];
      if (!track) return;
      const newTorch = !torch;
      await track.applyConstraints({ advanced: [{ torch: newTorch }] });
      setTorch(newTorch);
    } catch {}
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    setFlash(true);
    setTimeout(() => setFlash(false), 200);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPreview(dataUrl);
  };

  const handleConfirm = () => {
    if (!preview) return;
    onCapture({
      name: `foto_${Date.now()}.jpg`,
      type: "image/jpeg",
      size: 0,
      icon: "📷",
      data: preview,
    });
    onClose();
  };

  const handleRetake = () => setPreview(null);

  const c = {
    bg: isDark ? "#071a14" : "#f0faf7",
    panel: isDark ? "#0d2e1f" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text: isDark ? "#e0f5f0" : "#071a14",
    btn: isDark ? "#0a2218" : "#e0f5ef",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        backgroundColor: "rgba(0,0,0,0.95)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Flash */}
      {flash && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "white",
            zIndex: 1000,
            opacity: 0.8,
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            cursor: "pointer",
            color: "white",
            fontSize: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
        <span
          style={{
            color: "white",
            fontSize: "14px",
            fontWeight: "600",
            letterSpacing: "1px",
          }}
        >
          {preview ? "CONFIRMAR FOTO" : "CÂMERA"}
        </span>
        <button
          onClick={() => setGridOn((v) => !v)}
          style={{
            background: gridOn
              ? "rgba(0,229,255,0.3)"
              : "rgba(255,255,255,0.1)",
            border: gridOn ? "1px solid #00e5ff" : "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            cursor: "pointer",
            color: gridOn ? "#00e5ff" : "white",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ⊞
        </button>
      </div>

      {/* Viewfinder */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "600px",
          aspectRatio: "4/3",
          backgroundColor: "#000",
          overflow: "hidden",
        }}
      >
        {error ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <span style={{ fontSize: "40px" }}>📷</span>
            <span
              style={{
                color: "#ff6677",
                fontSize: "13px",
                textAlign: "center",
                padding: "0 20px",
              }}
            >
              {error}
            </span>
          </div>
        ) : preview ? (
          <img
            src={preview}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: facingMode === "user" ? "scaleX(-1)" : "none",
              }}
            />
            {/* Grid */}
            {gridOn && (
              <svg
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",
                }}
              >
                <line
                  x1="33%"
                  y1="0"
                  x2="33%"
                  y2="100%"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                />
                <line
                  x1="66%"
                  y1="0"
                  x2="66%"
                  y2="100%"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="33%"
                  x2="100%"
                  y2="33%"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="66%"
                  x2="100%"
                  y2="66%"
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                />
              </svg>
            )}
            {/* Cantos do viewfinder */}
            {["tl", "tr", "bl", "br"].map((pos) => (
              <div
                key={pos}
                style={{
                  position: "absolute",
                  top: pos.startsWith("t") ? "12px" : "auto",
                  bottom: pos.startsWith("b") ? "12px" : "auto",
                  left: pos.endsWith("l") ? "12px" : "auto",
                  right: pos.endsWith("r") ? "12px" : "auto",
                  width: "20px",
                  height: "20px",
                  borderTop: pos.startsWith("t") ? "2px solid #00e5ff" : "none",
                  borderBottom: pos.startsWith("b")
                    ? "2px solid #00e5ff"
                    : "none",
                  borderLeft: pos.endsWith("l") ? "2px solid #00e5ff" : "none",
                  borderRight: pos.endsWith("r") ? "2px solid #00e5ff" : "none",
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Zoom slider — só quando não é preview */}
      {!preview && !error && (
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "10px 24px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ color: "#7aada0", fontSize: "11px" }}>1x</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={zoom}
            onChange={async (e) => {
              const val = parseFloat(e.target.value);
              setZoom(val);
              try {
                const track = streamRef.current?.getVideoTracks()[0];
                const caps = track?.getCapabilities?.();
                if (caps?.zoom)
                  await track.applyConstraints({ advanced: [{ zoom: val }] });
              } catch {}
            }}
            style={{ flex: 1, accentColor: "#00e5ff" }}
          />
          <span style={{ color: "#7aada0", fontSize: "11px" }}>3x</span>
          <span
            style={{
              color: "#00e5ff",
              fontSize: "12px",
              fontWeight: "700",
              minWidth: "30px",
            }}
          >
            {zoom.toFixed(1)}x
          </span>
        </div>
      )}

      {/* Controles */}
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "16px 24px 24px",
        }}
      >
        {preview ? (
          <>
            <button
              onClick={handleRetake}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                borderRadius: "12px",
                padding: "12px 24px",
                color: "white",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              ↩ Repetir
            </button>
            <button
              onClick={handleConfirm}
              style={{
                background: "linear-gradient(135deg, #00e5ff, #00c896)",
                border: "none",
                borderRadius: "12px",
                padding: "12px 32px",
                color: "#071a14",
                fontSize: "14px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ✓ Usar foto
            </button>
          </>
        ) : (
          <>
            {/* Lanterna */}
            <button
              onClick={toggleTorch}
              style={{
                background: torch
                  ? "rgba(255,220,0,0.2)"
                  : "rgba(255,255,255,0.1)",
                border: torch ? "1px solid #ffdd00" : "none",
                borderRadius: "50%",
                width: "48px",
                height: "48px",
                cursor: "pointer",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              🔦
            </button>

            {/* Botão capturar */}
            <button
              onClick={handleCapture}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "white",
                border: "4px solid rgba(0,229,255,0.6)",
                cursor: "pointer",
                outline: "none",
                boxShadow: "0 0 20px rgba(0,229,255,0.4)",
                transition: "transform 0.1s",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.92)")
              }
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            />

            {/* Virar câmera */}
            {hasMultipleCameras && (
              <button
                onClick={toggleCamera}
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: "48px",
                  height: "48px",
                  cursor: "pointer",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🔄
              </button>
            )}
            {!hasMultipleCameras && <div style={{ width: "48px" }} />}
          </>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

// ============ CHAT INPUT ============
const ChatInput = ({ onSend, isLoading, isDark }) => {
  const [text, setText] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [attachedAudio, setAttachedAudio] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
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
  const handleCameraCapture = (file) => {
    setAttachedFile(file);
    setAttachedAudio(null);
  };
  const hasContent = text.trim() || attachedFile || attachedAudio;

  return (
    <>
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          isDark={isDark}
        />
      )}

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
          <FileAttachment
            onFileSelect={handleFileSelect}
            isDark={isDark}
            disabled={isLoading || !!attachedAudio}
          />
          <AudioRecorder
            onAudioReady={handleAudioReady}
            isDark={isDark}
            disabled={isLoading || !!attachedFile}
          />

          {/* Botão câmera */}
          <button
            onClick={() => setShowCamera(true)}
            disabled={isLoading || !!attachedFile || !!attachedAudio}
            title="Tirar foto"
            style={{
              background: "transparent",
              border: "none",
              cursor:
                isLoading || !!attachedFile || !!attachedAudio
                  ? "not-allowed"
                  : "pointer",
              padding: "4px",
              borderRadius: "8px",
              fontSize: "18px",
              opacity: isLoading || !!attachedFile || !!attachedAudio ? 0.4 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "opacity 0.2s",
            }}
          >
            📷
          </button>

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
                      setAttachedFile({
                        name: "imagem_colada.png",
                        type: file.type,
                        size: file.size,
                        icon: "🖼️",
                        data: ev.target.result,
                      });
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
