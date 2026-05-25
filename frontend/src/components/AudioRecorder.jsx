import { useState, useRef, useEffect } from "react";

const AudioRecorder = ({ onAudioReady, isDark, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.state === "recording")
        mediaRecorderRef.current.stop();
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return m + ":" + sec;
  };

  // Converte AudioBuffer para WAV (formato aceito pelo Groq Whisper)
  const audioBufferToWav = (buffer) => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = buffer.length * blockAlign;
    const bufferSize = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferSize);
    const view = new DataView(arrayBuffer);

    const writeString = (offset, str) => {
      for (let i = 0; i < str.length; i++)
        view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, "data");
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        view.setInt16(
          offset,
          sample < 0 ? sample * 32768 : sample * 32767,
          true,
        );
        offset += 2;
      }
    }

    return arrayBuffer;
  };

  const convertToWav = async (blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const audioCtx = new AudioContext();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const wavBuffer = audioBufferToWav(audioBuffer);
    await audioCtx.close();
    return new Blob([wavBuffer], { type: "audio/wav" });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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

      mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          const wavBlob = await convertToWav(blob);
          const reader = new FileReader();
          reader.onload = (e) => {
            onAudioReady({
              data: e.target.result,
              type: "audio/wav",
              duration,
              name: "gravacao_" + Date.now() + ".wav",
            });
          };
          reader.readAsDataURL(wavBlob);
        } catch (err) {
          console.error("Erro ao converter audio:", err);
          // Fallback: envia o audio original sem conversao
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
        }
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
