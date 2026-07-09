import { useState, useCallback } from "react";
import { sendMessage, uploadKnowledge, extractPdfText } from "../services/api";

const getTime = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const WELCOME_MESSAGE = {
  id: 1,
  role: "assistant",
  content: "Não há problema sem solução. Apresente o seu?",
  time: getTime(),
};

// Garante que content do histórico é sempre string — nunca array
const toHistoryString = (content) => {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content.filter(c => c.type === "text").map(c => c.text).join(" ") || "[imagem]";
  return String(content);
};

const useChat = (studyMode = false) => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [selectedModel, setSelectedModel] = useState(() =>
    localStorage.getItem("hermes-model") || "thiago-doutor"
  );

  const loadMessages = useCallback((savedMessages) => {
    if (!savedMessages?.length) return;
    setMessages(savedMessages.map((m, i) => ({
      id: Date.now() + i,
      role: m.role,
      content: m.content || "",
      time: m.time || "",
    })));
    setHistory(savedMessages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: toHistoryString(m.content) }))
    );
  }, []);

  const changeModel = useCallback((modelKey) => {
    setSelectedModel(modelKey);
    localStorage.setItem("hermes-model", modelKey);
  }, []);

  const sendUserMessage = useCallback(async (text, files = [], audio = null, useRAG = false) => {
    const fileList = Array.isArray(files) ? files : files ? [files] : [];
    const displayContent = audio
      ? `${text ? text + "\n\n" : ""}🎙️ Audio`
      : text || "";

    setMessages((prev) => [...prev, {
      id: Date.now(), role: "user", content: displayContent, time: getTime(), file: fileList[0] || null, files: fileList,
    }]);
    setIsLoading(true);

    const thinkingId = Date.now() + 1;
    setMessages((prev) => [...prev, {
      id: thinkingId, role: "thinking", content: "", time: "",
    }]);

    try {
      let imagesBase64 = [];
      let audioBase64 = null;
      let audioMime = null;
      let messageText = text || "";

      const imageFiles = fileList.filter((f) => f.type?.startsWith("image/"));
      if (imageFiles.length) {
        imagesBase64 = imageFiles.map((f) => f.data);
      } else if (fileList[0]) {
        const file = fileList[0];
        if (file.type === "application/pdf") {
          try {
            const base64 = file.data.includes(",") ? file.data.split(",")[1] : file.data;
            const byteChars = atob(base64);
            const byteArr = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
            const blob = new Blob([byteArr], { type: "application/pdf" });
            const pdfFile = new File([blob], file.name, { type: "application/pdf" });
            const pdfText = await extractPdfText(pdfFile);
            messageText += `\n\nConteudo do PDF "${file.name}":\n\`\`\`\n${pdfText}\n\`\`\``;
          } catch {
            messageText += `\n\n[PDF: ${file.name} - nao foi possivel extrair o texto]`;
          }
        } else {
          try {
            const decoded = atob(file.data.split(",")[1]);
            messageText += `\n\nConteudo de "${file.name}":\n\`\`\`\n${decoded.substring(0, 3000)}\n\`\`\``;
          } catch {
            messageText += `\n\n[Arquivo: ${file.name}]`;
          }
        }
      }

      if (audio) {
        audioBase64 = audio.data.includes(",") ? audio.data.split(",")[1] : audio.data;
        audioMime = audio.type || "audio/wav";
      }

      const aiId = Date.now() + 2;
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId).concat({
        id: aiId, role: "assistant", content: "", time: getTime(), modelKey: null,
      }));

      let fullResponse = "";
      const response = await sendMessage(
        messageText || displayContent,
        history,
        imagesBase64,
        (token, done, mk) => {
          fullResponse += token;
          const nk = {"Thiago Analiza":"thiago-analiza","Thiago Jr":"thiago-jr","Thiago Senhor":"thiago-senior","Thiago Doutor":"thiago-doutor","Thiago Especialista":"thiago-especialista","Thiago Supremo":"thiago-supremo"};
          const fm = fullResponse.match(/continuando com (.+?)\.*/);;
          if (fm) { const found = Object.keys(nk).find(k => fm[1].includes(k)); if (found) setSelectedModel(nk[found]); }
          const fi = fullResponse.match(/redirecionando para (.+?)\./);
          if (fi) { const found = Object.keys(nk).find(k => fi[1].includes(k)); if (found) setSelectedModel(nk[found]); }
          setMessages((prev) =>
            prev.map((m) => m.id === aiId ? { ...m, content: fullResponse, ...(mk ? { modelKey: mk } : {}) } : m)
          );
        },
        audioBase64,
        audioMime,
        selectedModel,
        studyMode,
        useRAG,
        activeProject?.context || ""
      );

      // Sempre salva strings no histórico — nunca arrays
      const histUser = messageText || displayContent;
      const histAssistant = typeof response === "string" && response ? response : fullResponse;
      setHistory((prev) => [
        ...prev,
        { role: "user", content: toHistoryString(histUser) },
        { role: "assistant", content: toHistoryString(histAssistant) },
      ]);

    } catch (error) {
      const traduzirErro = (msg) => {
        if (!msg) return "Erro desconhecido. Tente novamente.";
        if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("network")) return "Sem conexao com o servidor. Verifique sua internet ou aguarde um momento.";
        if (msg.includes("timeout") || msg.includes("Timeout")) return "O servidor demorou demais para responder. Tente novamente.";
        if (msg.includes("401") || msg.includes("Unauthorized")) return "Sessao expirada. Faca login novamente.";
        if (msg.includes("403") || msg.includes("Forbidden")) return "Acesso negado.";
        if (msg.includes("429") || msg.includes("rate limit")) return "Muitas mensagens em pouco tempo. Aguarde alguns segundos.";
        if (msg.includes("500") || msg.includes("Internal Server")) return "Erro interno do servidor. Tente novamente em instantes.";
        if (msg.includes("502") || msg.includes("503") || msg.includes("504")) return "Servidor temporariamente indisponivel. Aguarde um momento.";
        if (msg.includes("413") || msg.includes("too large")) return "Arquivo muito grande para enviar.";
        return `Erro: ${msg}`;
      };
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId).concat({
        id: Date.now() + 2, role: "error", content: traduzirErro(error.message), time: getTime(),
      }));
    } finally {
      setIsLoading(false);
    }
  }, [history, selectedModel, studyMode]);

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setHistory([]);
  }, []);

  return { messages, isLoading, sendUserMessage, clearChat, loadMessages, selectedModel, changeModel, activeProject, setActiveProject };
};

export default useChat;