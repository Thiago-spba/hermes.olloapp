import { useRef, useState } from "react";

const AudioPreview = ({ audio, onRemove, isDark }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!audio) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div style={{ ...styles.container, backgroundColor: isDark ? "#0d2e1f" : "#ccede5", borderColor: isDark ? "#1a5c3a" : "#7aada0" }}>
      <span style={styles.icon}>🎙️</span>
      <div style={styles.info}>
        <span style={{ ...styles.name, color: isDark ? "#e0f5f0" : "#071a14" }}>Audio gravado</span>
        <span style={styles.duration}>{formatDuration(audio.duration)}</span>
      </div>
      <button onClick={togglePlay} style={{ ...styles.playButton, backgroundColor: isDark ? "#143d2e" : "#b0ddd4", color: isDark ? "#00e5ff" : "#0099bb" }}>
        {isPlaying ? "⏸" : "▶"}
      </button>
      <audio ref={audioRef} src={audio.data} onEnded={() => setIsPlaying(false)} style={{ display: "none" }} />
      <button onClick={onRemove} style={{ ...styles.removeButton, color: isDark ? "#7aada0" : "#2a6b5a" }}>✕</button>
    </div>
  );
};

const styles = {
  container: { display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "8px", border: "1px solid", marginBottom: "8px", transition: "background-color 0.3s ease" },
  icon: { fontSize: "20px", flexShrink: 0 },
  info: { flex: 1, display: "flex", flexDirection: "column", gap: "2px" },
  name: { fontSize: "12px", fontWeight: "500", transition: "color 0.3s ease" },
  duration: { fontSize: "10px", color: "#7aada0", fontFamily: "monospace" },
  playButton: { border: "none", borderRadius: "6px", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", cursor: "pointer", flexShrink: 0 },
  removeButton: { backgroundColor: "transparent", border: "none", fontSize: "14px", cursor: "pointer", padding: "2px 6px", borderRadius: "4px", flexShrink: 0 },
};

export default AudioPreview;

