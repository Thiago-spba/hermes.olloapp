// ============================================
// HERMES AI — Ponto de entrada da aplicação
// Monta o React e registra o Service Worker PWA
// ============================================

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Monta o app no elemento #root
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registra o Service Worker para PWA offline
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("✅ Service Worker registrado"))
      .catch((err) => console.warn("❌ Service Worker falhou:", err));
  }, { merge: true });
}

