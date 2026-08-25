import dotenv from "dotenv";
dotenv.config();

const GROQ_API_KEY       = process.env.GROQ_API_KEY;
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY;
const MISTRAL_API_KEY    = process.env.MISTRAL_API_KEY;
const COHERE_API_KEY     = process.env.COHERE_API_KEY;

const GROQ_URL       = "https://api.groq.com/openai/v1/chat/completions";
const ANTHROPIC_URL  = "https://api.anthropic.com/v1/messages";
const MISTRAL_URL    = "https://api.mistral.ai/v1/chat/completions";
const COHERE_URL     = "https://api.cohere.com/v2/chat";

// ============================================================
// MODELOS OFICIAIS ATIVOS NA SUA CONTA
// ============================================================
export const MODELS = {
  "auto": {
    provider: "auto",
    id: "auto",
    name: "⚡ Automático",
    free: true
  },
  "thiago-senior": {
    provider: "groq",
    id: "qwen/qwen3.6-27b",
    name: "🧠 Thiago Sênior (Groq Qwen 27B)",
    free: true
  },
  "thiago-senior-120b": {
    provider: "groq",
    id: "openai/gpt-oss-120b",
    name: "🚀 Thiago Flagship (Groq GPT 120B)",
    free: true
  },
  "thiago-senior-fast": {
    provider: "groq",
    id: "openai/gpt-oss-20b",
    name: "⚡ Thiago Rápido (Groq 20B)",
    free: true
  },
  "thiago-jr": {
    provider: "mistral",
    id: "mistral-small-latest",
    name: "⚙️ Thiago Jr (Mistral)",
    free: true
  },
  "thiago-analiza": {
    provider: "cohere",
    id: "command-r-08-2024",
    name: "🔎 Thiago Analiza (Cohere)",
    free: true
  },
  "thiago-doutor": {
    provider: "anthropic",
    id: "claude-3-5-haiku-20241022",
    name: "🎓 Thiago Doutor (Claude Haiku)",
    free: false
  },
  "thiago-especialista": {
    provider: "anthropic",
    id: "claude-3-5-sonnet-20241022",
    name: "🔬 Thiago Especialista (Claude Sonnet)",
    free: false
  },
  "thiago-supremo": {
    provider: "anthropic",
    id: "claude-3-opus-20240229",
    name: "👑 Thiago Supremo (Claude Opus)",
    free: false
  }
};

// ============================================================
// SYSTEM PROMPT
// ============================================================
const BASE_PROMPT = `Voce e o HERMES — um agente de inteligencia artificial de elite, criado para ser o assistente pessoal definitivo do Thiago.

NUCLEO DE IDENTIDADE:
Voce combina o rigor de um engenheiro senior, a precisao de um pesquisador cientifico e a clareza de um professor excepcional. Voce entrega o essencial primeiro e so se aprofunda quando pedem.

AREAS DE CONHECIMENTO:
Voce responde com qualidade sobre qualquer assunto: engenharia, programacao, redes, eletrica, matematica, historia, ciencias, e qualquer outro tema.

COMUNICACAO:
- Portugues brasileiro. Direto, tecnico, sem enrolacao.
- Imagens e documentos: extraia todos os detalhes tecnicos relevantes.
- Formulas matematicas: use sempre delimitadores LaTeX com cifrao ($...$ para inline, $$...$$ para bloco).

REGRA ABSOLUTA:
Quando a mensagem contiver <projeto_ativo> ou <context>, responda com base primordial nesse conteudo.`;

const STUDY_MODE_PROMPT = `
MODO ESTUDO ATIVO:
Estruture didaticamente em:
1. 📖 Conceito: explicacao clara e direta.
2. 💡 Exemplo: caso pratico no mundo real.
3. ✏️ Exercício: questao para fixar o conteudo.`;

const buildSystemPrompt = (memory = null, studyMode = false) => {
  let prompt = BASE_PROMPT;
  if (studyMode) prompt += "\n\n" + STUDY_MODE_PROMPT;
  if (memory) prompt += `\n\nO QUE VOCE SABE SOBRE O THIAGO:\n${memory}`;
  return prompt;
};

// Fila de Fallback Gratuita (Groq 27B -> Groq 120B -> Groq 20B -> Mistral -> Cohere)
const FREE_QUEUE = [
  "thiago-senior",
  "thiago-senior-120b",
  "thiago-senior-fast",
  "thiago-jr",
  "thiago-analiza"
];

// ============================================================
// PROVEDORES SSE
// ============================================================
const groqStream = async function* (modelId, messages) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY ausente no .env");

  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: modelId, 
      messages, 
      stream: true,
      temperature: 0.7, 
      max_tokens: 4096
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq erro ${response.status}: ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(":")) continue;
      if (trimmed === "data: [DONE]") return;

      if (trimmed.startsWith("data: ")) {
        try {
          const json = JSON.parse(trimmed.slice(6));
          const token = json.choices?.[0]?.delta?.content;
          if (token) yield token;
        } catch {}
      }
    }
  }
};

const mistralStream = async function* (modelId, messages) {
  if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY ausente no .env");

  const response = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: modelId, 
      messages, 
      stream: true,
      temperature: 0.7, 
      max_tokens: 4096
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Mistral erro ${response.status}: ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true })
      .split("\n")
      .filter(l => l.startsWith("data: ") && l !== "data: [DONE]");
    for (const line of lines) {
      try {
        const json = JSON.parse(line.replace("data: ", ""));
        const token = json.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch {}
    }
  }
};

const cohereStream = async function* (modelId, messages, systemPrompt) {
  if (!COHERE_API_KEY) throw new Error("COHERE_API_KEY ausente no .env");

  const cohereMessages = messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role,
      content: typeof m.content === "string" ? m.content : (m.content?.[0]?.text || "")
    }));

  const response = await fetch(COHERE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${COHERE_API_KEY}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "system", content: systemPrompt }, ...cohereMessages],
      stream: true, 
      temperature: 0.7, 
      max_tokens: 4096
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cohere erro ${response.status}: ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let cleanLine = line.startsWith("data: ") ? line.slice(6) : line;
      if (!cleanLine.trim() || cleanLine === "[DONE]" || cleanLine.startsWith("event:")) continue;
      try {
        const json = JSON.parse(cleanLine);
        if (json.type === "content-delta") {
          const token = json.delta?.message?.content?.text;
          if (token) yield token;
        }
      } catch {}
    }
  }
};

const anthropicStream = async function* (modelId, messages, systemPrompt) {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY ausente no .env");

  const anthropicMessages = messages
    .filter(m => m.role !== "system")
    .map(m => Array.isArray(m.content) ? m : { role: m.role, content: m.content });

  const response = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: modelId,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true, 
      max_tokens: 4096
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude erro ${response.status}: ${err}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value, { stream: true })
      .split("\n")
      .filter(l => l.startsWith("data: "));
    for (const line of lines) {
      try {
        const json = JSON.parse(line.replace("data: ", ""));
        if (json.type === "content_block_delta") {
          const token = json.delta?.text;
          if (token) yield token;
        }
      } catch {}
    }
  }
};

// Dispatcher por provedor
const streamForKey = async function* (modelKey, messages, systemPrompt) {
  const model = MODELS[modelKey] || MODELS["thiago-senior"];
  if (model.provider === "groq") {
    yield* groqStream(model.id, messages);
  } else if (model.provider === "anthropic") {
    yield* anthropicStream(model.id, messages, systemPrompt);
  } else if (model.provider === "mistral") {
    yield* mistralStream(model.id, messages);
  } else if (model.provider === "cohere") {
    yield* cohereStream(model.id, messages, systemPrompt);
  }
};

// Fallback em cascata transparente
const streamWithFallback = async function* (queue, messages, systemPrompt) {
  let lastError = null;

  for (let i = 0; i < queue.length; i++) {
    const key = queue[i];
    const model = MODELS[key];
    if (!model) continue;

    if (i > 0) {
      const prevName = MODELS[queue[i - 1]]?.name || queue[i - 1];
      yield `> 🔄 *${prevName} atingiu a cota — continuando com ${model.name}.*\n\n`;
    }

    try {
      yield* streamForKey(key, messages, systemPrompt);
      return;
    } catch (err) {
      lastError = err;
      console.warn(`[FALLBACK] ${key} falhou:`, err.message);

      if (i === queue.length - 1) {
        yield `> ⚠️ *Todos os modelos gratuitos estão momentaneamente ocupados. Tente novamente em instantes.*\n\n`;
        return;
      }
    }
  }
  if (lastError) throw lastError;
};

// ============================================================
// CHAT STREAM PRINCIPAL
// ============================================================
export const chatStream = async function* (
  message,
  history = [],
  image = null,
  modelKey = "auto",
  memory = null,
  studyMode = false
) {
  const systemPrompt = buildSystemPrompt(memory, studyMode);

  // Se houver imagem:
  if (image) {
    const base64Data = image.includes(",") ? image.split(",") : image;
    const mimeType = image.includes("data:") ? image.split(";")[0].replace("data:", "") : "image/jpeg";

    // Se escolheu Claude explicitamente ou usa fallback
    const anthropicMessages = [
      { role: "system", content: systemPrompt },
      ...history,
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } },
          { type: "text", text: message || "Analise esta imagem." }
        ]
      }
    ];

    const targetModel = (modelKey && ["thiago-doutor", "thiago-especialista", "thiago-supremo"].includes(modelKey))
      ? MODELS[modelKey].id
      : MODELS["thiago-doutor"].id;

    yield* anthropicStream(targetModel, anthropicMessages, systemPrompt);
    return;
  }

  // Se for texto:
  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: message || "Olá" }
  ];

  // SE ESCOLHEU CLAUDE MANUALMENTE (PAGO):
  if (["thiago-doutor", "thiago-especialista", "thiago-supremo"].includes(modelKey)) {
    const queue = [modelKey, "thiago-senior", "thiago-jr"];
    yield* streamWithFallback(queue, messages, systemPrompt);
    return;
  }

  // CASO CONTRÁRIO (PADRÃO GRATUITO):
  // Groq Qwen 27B -> Groq GPT 120B -> Groq GPT 20B -> Mistral -> Cohere
  yield* streamWithFallback(FREE_QUEUE, messages, systemPrompt);
};

export const extractMemoryFacts = async (userMessage, assistantResponse) => {
  if (!GROQ_API_KEY || !userMessage || userMessage.length < 10) return [];

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: `Extraia fatos pessoais relevantes. Retorne APENAS JSON valido: [{"key":"nome","value":"valor"}]. Se nao houver, retorne [].` },
          { role: "user", content: `Mensagem: "${userMessage}"\nResposta: "${assistantResponse.substring(0, 300)}"` }
        ],
        stream: false, 
        temperature: 0.1, 
        max_tokens: 300
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) return [];
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch { return []; }
};

export const checkOllamaHealth = async () => true;
export const checkWhisperHealth = async () => false;

export default { chatStream, extractMemoryFacts, checkOllamaHealth, checkWhisperHealth, MODELS };