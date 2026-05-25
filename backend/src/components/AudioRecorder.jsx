import { useState, useRef, useEffect } from "react";

const AudioRecorder = ({ onAudioReady, isDark, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === "recording")
        mediaRecorderRef.current.stop();
    };
  }, []);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return m + ":" + sec;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onload = (e) => {
          onAudioReady({
            data: e.target.result,
            type: mimeType,
            duration,
            name: "gravacao_" + Date.now() + ".webm",
          });
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
        setDuration(0);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= 300) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      alert(
        error.name === "NotAllowedError"
          ? "Permissao de microfone negada."
          : "Erro: " + error.message,
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording")
      mediaRecorderRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleClick = () => {
    if (disabled) return;
    if (isRecording) stopRecording();
    else startRecording();
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={{
        border: "none",
        borderRadius: "8px",
        fontSize: "18px",
        padding: "4px 6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s ease",
        flexShrink: 0,
        height: "28px",
        minWidth: isRecording ? "64px" : "28px",
        backgroundColor: isRecording ? "#ff4455" : "transparent",
        color: isRecording ? "#ffffff" : isDark ? "#7aada0" : "#2a6b5a",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: isRecording ? "0 0 10px rgba(255,68,85,0.5)" : "none",
      }}
      aria-label={isRecording ? "Parar" : "Gravar"}
    >
      {isRecording ? (
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
            fontWeight: "600",
            fontFamily: "monospace",
          }}
        >
          <span style={{ fontSize: "8px", color: "#fff" }}>●</span>
          {formatDuration(duration)}
        </span>
      ) : (
        "🎤"
      )}
    </button>
  );
};

export default AudioRecorder;
