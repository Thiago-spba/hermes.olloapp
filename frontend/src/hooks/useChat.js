import { useState, useCallback } from "react";
import { sendMessage, uploadPDF, uploadKnowledge } from "../services/api";

const getTime = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const WELCOME_MESSAGE = {
  id: 1,
  role: "assistant",
  content: "Não há problema sem solução. Apresente o seu?",
  time: getTime(),
};

// ✅ ALTERADO: aceita studyMode como parâmetro
const useChat = (studyMode = false) => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
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
      .map((m) => ({ role: m.role, content: m.content }))
    );
  }, []);

  const changeModel = useCallback((modelKey) => {
    setSelectedModel(modelKey);
    localStorage.setItem("hermes-model", modelKey);
  }, []);

  const sendUserMessage = useCallback(async (text, file = null, audio = null) => {
    const displayContent = file
      ? `${text ? text + "\n\n" : ""}[arquivo] ${file.name}`
      : audio
        ? `${text ? text + "\n\n" : ""}🎙️ Audio`
        : text;

    setMessages((prev) => [...prev, {
      id: Date.now(), role: "user", content: displayContent, time: getTime(), file: file || null,
    }]);
    setIsLoading(true);

    const thinkingId = Date.now() + 1;
    setMessages((prev) => [...prev, {
      id: thinkingId, role: "thinking", content: "", time: "",
    }]);

    try {
      let imageBase64 = null;
      let audioBase64 = null;
      let audioMime = null;
      let messageText = text || "";

      if (file) {
        if (file.type.startsWith("image/")) {
          imageBase64 = file.data;
        } else if (file.type === "application/pdf") {
          const result = await uploadKnowledge([file.fileObj || new File([await fetch(file.data).then(r=>r.blob())], file.name, {type: file.type})]);
          const aiId = Date.now() + 2;
          setMessages((prev) => prev.filter((m) => m.id !== thinkingId).concat({
            id: aiId, role: "assistant", content: "", time: getTime(),
          }));
          setMessages((prev) => prev.map((m) =>
            m.id === aiId ? { ...m, content: `PDF adicionado a Base de Conhecimento! Pode perguntar sobre ele agora.` } : m
          ));
          setIsLoading(false);
          return;
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
        imageBase64,
        (token, done, mk) => {
          fullResponse += token;
          setMessages((prev) =>
            prev.map((m) => m.id === aiId ? { ...m, content: fullResponse, ...(mk ? { modelKey: mk } : {}) } : m)
          );
        },
        audioBase64,
        audioMime,
        selectedModel,
        studyMode // ✅ ADICIONADO
      );

      setHistory((prev) => [
        ...prev,
        { role: "user", content: messageText || displayContent },
        { role: "assistant", content: response },
      ]);

    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId).concat({
        id: Date.now() + 2, role: "error", content: `Erro: ${error.message}`, time: getTime(),
      }));
    } finally {
      setIsLoading(false);
    }
  }, [history, selectedModel, studyMode]); // ✅ ADICIONADO studyMode na dependência

  const clearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
    setHistory([]);
  }, []);

  return { messages, isLoading, sendUserMessage, clearChat, loadMessages, selectedModel, changeModel };
};

export default useChat;
