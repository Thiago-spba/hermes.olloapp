import dotenv from "dotenv";
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const COHERE_API_KEY = process.env.COHERE_API_KEY;

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const COHERE_URL = "https://api.cohere.com/v2/chat";

export const MODELS = {
  "thiago-analiza":     { provider: "cohere",    id: "command-a-03-2025",       name: "🔎 Thiago Analiza",      free: true },
  "thiago-jr":          { provider: "mistral",   id: "mistral-small-latest",    name: "⚙️ Thiago Jr",           free: true },
  "thiago-senior":      { provider: "groq",      id: "llama-3.3-70b-versatile", name: "🧠 Thiago Sênior",       free: true },
  "thiago-doutor":      { provider: "anthropic", id: "claude-haiku-4-5",        name: "🎓 Thiago Doutor",       free: false },
  "thiago-especialista":{ provider: "anthropic", id: "claude-sonnet-4-6",       name: "🔬 Thiago Especialista", free: false },
  "thiago-supremo":     { provider: "anthropic", id: "claude-opus-4-7",         name: "👑 Thiago Supremo",      free: false },
};

const DEFAULT_MODEL = "thiago-doutor";

const BASE_PROMPT = `Voce e o HERMES — um agente de inteligencia artificial de elite, criado para ser o assistente pessoal definitivo do Thiago.

NUCLEO DE IDENTIDADE:
Voce combina o rigor de um engenheiro senior, a precisao de um pesquisador cientifico e a clareza de um professor excepcional. Seu padrao minimo de resposta e o que um profissional senior entregaria para um colega de alto nivel.

AREAS DE CONHECIMENTO — SEM RESTRICOES:
Voce responde com o mesmo rigor e qualidade sobre QUALQUER assunto: engenharia, programacao, tecnologia, redes, eletrica, eletronica, matematica, ciencias exatas, saude, medicina, nutricao, historia, direito, financas, economia, filosofia, psicologia, culinaria, arte, musica, literatura, idiomas, esportes, geopolitica, e qualquer outro tema. Nao ha perguntas fora do escopo. Se o Thiago pergunta, voce responde.

ANTES DE RESPONDER — pergunte a si mesmo:
- Tenho certeza absoluta disso ou estou suposicionando?
- Esta e a forma mais clara e direta de explicar?
- Existe risco nessa acao que o usuario precisa saber antes?
- Estou resolvendo o problema raiz ou apenas o sintoma?

COMUNICACAO:
- Portugues brasileiro. Direto, tecnico, sem enrolacao.
- Calibre a profundidade da resposta ao nivel demonstrado pelo usuario.
- Para conceitos complexos: analogia primeiro, tecnica depois.
- Imagens e documentos: extraia TODOS os detalhes tecnicos relevantes — numeros, erros, versoes, topologia, componentes.

INTEGRIDADE ABSOLUTA:
- Certeza = responda. Duvida = declare a duvida. Desconhecimento = diga claramente.
- Nunca invente dados, codigos, APIs, referencias, nomes de funcoes ou resultados.
- Nunca complete lacunas com suposicoes disfarcadas de fatos.
- Se nao souber: "Nao tenho certeza sobre isso. Recomendo verificar em [fonte especifica: documentacao oficial / IEEE / MDN / RFC / fabricante]."

METODO DE TRABALHO:
- Responda direto, de forma completa. NAO pergunte "tudo de uma vez ou etapa por etapa" por padrao.
- So divida em etapas (e pergunte antes) se a tarefa for realmente longa/complexa OU se o usuario pedir explicitamente.
- Codigo: explique a logica ANTES de mostrar o codigo. Aponte riscos antes de executar.
- Debugging: identifique a causa raiz, nao apenas o sintoma. Proponha solucao definitiva.
- Calculos de engenharia: mostre o raciocinio completo, unidades e hipoteses assumidas.
- Quando houver multiplas solucoes validas: apresente as opcoes com trade-offs claros.

PROATIVIDADE:
- Se detectar um erro ou risco nao perguntado, aponte antes de responder o que foi pedido.
- Se a pergunta for ambigua, resolva a interpretacao mais provavel E pergunte se era isso.
- Sugira a proxima etapa logica ao final de respostas tecnicas complexas.

FERRAMENTAS:
- Dados e comparacoes visuais: oferea gerar com Chart.js ou tabela markdown estruturada.
- Calculos complexos: mostre formula, substituicao numerica e resultado com unidades.
- Fontes confiaveis para verificacao: documentacao oficial, IEEE Xplore, MDN Web Docs, RFC, datasheets do fabricante.

REGRA ABSOLUTA:
Quando a mensagem contiver a secao CONTEUDO, responda EXCLUSIVAMENTE com base nesse conteudo. Nunca alegue nao ter acesso a documentos quando o conteudo estiver presente.`;

const STUDY_MODE_PROMPT = `

MODO ESTUDO ATIVO:
Voce esta em modo de ensino estruturado. Para CADA resposta, independente do assunto, siga OBRIGATORIAMENTE este formato:

📖 CONCEITO
Explique o conceito de forma clara, direta e precisa. Use linguagem acessivel sem perder rigor tecnico.

💡 EXEMPLO
Apresente um exemplo pratico e real que ilustre o conceito. Prefira exemplos do cotidiano ou da area tecnica relevante.

✏️ EXERCICIO
Proponha uma questao ou desafio pratico para o usuario fixar o conteudo. Pode ser uma pergunta reflexiva, um problema para resolver ou uma tarefa pratica.

Este formato e obrigatorio em TODAS as respostas enquanto o modo estudo estiver ativo.`;

const buildSystemPrompt = (memory = null, studyMode = false) => {
  let prompt = BASE_PROMPT;
  if (studyMode) prompt += STUDY_MODE_PROMPT;
  if (memory) prompt += `\n\nO QUE VOCE SABE SOBRE O THIAGO:\n${memory}`;
  return prompt;
};

// ============ GROQ ============
const groqRequest = async (modelId, messages) => {
  return await fetch(GROQ_URL, {
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
      max_tokens: 8192
    }),
    signal: AbortSignal.timeout(60000)
  });
};

const groqStream = async function* (modelId, messages) {
  const response = await groqRequest(modelId, messages);
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq erro ${response.status}: ${err}`);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter(l => l.startsWith("data: ") && l !== "data: [DONE]");
    for (const line of lines) {
      try {
        const json = JSON.parse(line.replace("data: ", ""));
        const token = json.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch {}
    }
  }
};

// ============ MISTRAL ============
const mistralStream = async function* (modelId, messages) {
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
      max_tokens: 8192
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
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter(l => l.startsWith("data: ") && l !== "data: [DONE]");
    for (const line of lines) {
      try {
        const json = JSON.parse(line.replace("data: ", ""));
        const token = json.choices?.[0]?.delta?.content;
        if (token) yield token;
      } catch {}
    }
  }
};

// ============ COHERE (CORRIGIDO) ============
const cohereStream = async function* (modelId, messages, systemPrompt) {
  const cohereMessages = messages.filter(m => m.role !== "system").map(m => ({
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
      messages: [
        { role: "system", content: systemPrompt },
        ...cohereMessages
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 8192
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
      
      // Remove o prefixo "data: " se existir
      let cleanLine = line;
      if (cleanLine.startsWith("data: ")) {
        cleanLine = cleanLine.slice(6);
      }
      
      // Pula linhas vazias, marcador de fim e linhas "event:"
      if (!cleanLine.trim() || cleanLine === "[DONE]") continue;
      if (cleanLine.startsWith("event:")) continue;
      
      try {
        const json = JSON.parse(cleanLine);
        if (json.type === "content-delta") {
          const token = json.delta?.message?.content?.text;
          if (token) yield token;
        }
      } catch (e) {
        // Ignora erros de parse em linhas malformadas
        console.debug("[Cohere] Parse error:", e.message);
      }
    }
  }
};

// ============ ANTHROPIC ============
const anthropicStream = async function* (modelId, messages, systemPrompt) {
  const anthropicMessages = messages.filter(m => m.role !== "system").map(m => {
    if (Array.isArray(m.content)) return m;
    return { role: m.role, content: m.content };
  });

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
      max_tokens: 8192
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
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
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

// ============ MAIN ============
export const chatStream = async function* (message, history = [], image = null, modelKey = "auto", memory = null, studyMode = false) {
  const systemPrompt = buildSystemPrompt(memory, studyMode);

  let selectedKey = modelKey === "auto" ? DEFAULT_MODEL : modelKey;
  if (image && (MODELS[selectedKey]?.provider === "groq" || MODELS[selectedKey]?.provider === "mistral" || MODELS[selectedKey]?.provider === "cohere")) {
    const oldName = MODELS[selectedKey]?.name || selectedKey;
    selectedKey = "thiago-doutor";
    yield `> 📷 *${oldName} não suporta imagens — redirecionando para 🎓 Thiago Doutor.*\n\n`;
  }

  const model = MODELS[selectedKey] || MODELS[DEFAULT_MODEL];

  // Limita historico para modelos com menor contexto
  // Normaliza content para string — Groq/Mistral nao aceitam arrays
  const normalizeContent = (m) => {
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.content)) return m.content.filter(c => c.type === "text").map(c => c.text).join(" ") || "[imagem]";
    return String(m.content || "");
  };

  const estimateTokens = (text) => Math.ceil(String(text || "").length / 4);
  const limitHistoryByTokens = (hist, maxTokens) => {
    const filtered = hist.filter(m => m.content);
    let total = 0;
    const result = [];
    for (let i = filtered.length - 1; i >= 0; i--) {
      const tokens = estimateTokens(Array.isArray(filtered[i].content) ? filtered[i].content.filter(c => c.type === "text").map(c => c.text).join(" ") : filtered[i].content);
      if (total + tokens > maxTokens) break;
      total += tokens;
      result.unshift(filtered[i]);
    }
    return result;
  };
  // Normaliza arrays de content para string em TODOS os providers não-Anthropic
  // Evita erro "content must be a string" quando histórico contém mensagens com imagem
  const normalizeHistory = (hist, maxTokens = null) => {
    const filtered = hist.filter(m => m.content);
    const mapped = filtered.map(m => ({
      ...m,
      content: Array.isArray(m.content)
        ? m.content.filter(c => c.type === "text").map(c => c.text).join(" ") || "[imagem]"
        : m.content
    }));
    if (!maxTokens) return mapped;
    let total = 0;
    const result = [];
    for (let i = mapped.length - 1; i >= 0; i--) {
      const tokens = estimateTokens(mapped[i].content);
      if (total + tokens > maxTokens) break;
      total += tokens;
      result.unshift(mapped[i]);
    }
    return result;
  };

  const limitedHistory = model.provider === "anthropic"
    ? history.filter(m => m.content)
    : normalizeHistory(history, 7000);

  const messages = [
    { role: "system", content: systemPrompt },
    ...limitedHistory.map(m => ({ role: m.role, content: m.content }))
  ];

  if (image) {
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeType = image.includes("data:") ? image.split(";")[0].replace("data:", "") : "image/jpeg";
    if (model.provider === "anthropic") {
      messages.push({
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } },
          { type: "text", text: message || "Analise esta imagem." }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Data}` } },
          { type: "text", text: message || "Analise esta imagem." }
        ]
      });
    }
  } else {
    messages.push({ role: "user", content: message || "Ola" });
  }

  // FALLBACK INTELIGENTE: Anthropic falha → tenta Mistral
  if (model.provider === "anthropic") {
    try {
      yield* anthropicStream(model.id, messages, systemPrompt);
    } catch (err) {
      yield `_(Thiago Doutor indisponivel — usando Thiago Jr como fallback)_\n\n`;
      yield* mistralStream("mistral-small-latest", messages);
    }
  } else if (model.provider === "mistral") {
    try {
      yield* mistralStream(model.id, messages);
    } catch (err) {
      if (err.message && (err.message.includes("429") || err.message.includes("rate"))) {
        yield `> 🔄 *${model.name} atingiu o limite — continuando com 🧠 Thiago Sênior.*\n\n`;
        const safe = messages.map(m => ({...m, content: typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content.filter(c => c.type === "text").map(c => c.text).join(" ") || "[imagem]" : String(m.content || "")}));
        yield* groqStream(MODELS["thiago-senior"].id, safe);
      } else { throw err; }
    }
  } else if (model.provider === "cohere") {
    try {
      yield* cohereStream(model.id, messages, systemPrompt);
    } catch (err) {
      if (err.message && (err.message.includes("429") || err.message.includes("422") || err.message.includes("rate") || err.message.includes("NO_VALID"))) {
        yield `> 🔄 *${model.name} atingiu o limite — continuando com ⚙️ Thiago Jr.*\n\n`;
        const safe = messages.map(m => ({...m, content: typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content.filter(c => c.type === "text").map(c => c.text).join(" ") || "[imagem]" : String(m.content || "")}));
        yield* mistralStream(MODELS["thiago-jr"].id, safe);
      } else { throw err; }
    }
  } else {
    const FALLBACK_QUEUE = ["thiago-analiza","thiago-jr","thiago-senior","thiago-doutor","thiago-especialista","thiago-supremo"];
    const MODEL_NAMES = {"thiago-analiza":"🔎 Thiago Analiza","thiago-jr":"⚙️ Thiago Jr","thiago-senior":"🧠 Thiago Sênior","thiago-doutor":"🎓 Thiago Doutor","thiago-especialista":"🔬 Thiago Especialista","thiago-supremo":"👑 Thiago Supremo"};
    const isRateError = (e) => e.message && (e.message.includes("413") || e.message.includes("429") || e.message.includes("rate") || e.message.includes("limit"));
    const toText = (msgs) => msgs.map(m => ({...m, content: typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content.filter(c => c.type === "text").map(c => c.text).join(" ") || "[imagem]" : String(m.content || "")}));
    const systemMsg = messages.find(m => m.role === "system");
    const userMsg = messages[messages.length - 1];
    const histMsgs = messages.filter(m => m.role !== "system").slice(0, -1);
    const normalizeMsg = (m) => ({...m, content: typeof m.content === "string" ? m.content : Array.isArray(m.content) ? m.content.filter(c => c.type === "text").map(c => c.text).join(" ") || "[imagem]" : String(m.content || "")});
    const reducedMessages = [systemMsg, ...histMsgs.slice(-3), userMsg].filter(Boolean).map(normalizeMsg);
    let success = false;
    try { yield* groqStream(model.id, messages); success = true; } catch (err) { if (!isRateError(err)) throw err; }
    if (!success) {
      try { yield* groqStream(model.id, reducedMessages); success = true; } catch (err) { if (!isRateError(err)) throw err; }
    }
    if (!success) {
      const currentIndex = FALLBACK_QUEUE.indexOf(selectedKey);
      const hasImage = image !== null;
      let nextIndex = hasImage ? FALLBACK_QUEUE.indexOf("thiago-doutor") : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= FALLBACK_QUEUE.length) {
        yield `> ⚠️ *Todos os modelos estão no limite. Tente em alguns minutos.*\n\n`;
        return;
      }
      const nextKey = FALLBACK_QUEUE[nextIndex];
      const nextModel = MODELS[nextKey];
      yield `> 🔄 *${MODEL_NAMES[selectedKey] || model.name} atingiu o limite — continuando com ${MODEL_NAMES[nextKey]}.*\n\n`;
      const safe = toText(reducedMessages);
      if (nextModel.provider === "anthropic") { yield* anthropicStream(nextModel.id, hasImage ? messages : safe, systemPrompt); }
      else if (nextModel.provider === "mistral") { yield* mistralStream(nextModel.id, safe); }
      else if (nextModel.provider === "cohere") { yield* cohereStream(nextModel.id, safe, systemPrompt); }
      else { yield* groqStream(nextModel.id, safe); }
    }
  }
};

export const chat = async (message, history = [], image = null, modelKey = "auto", memory = null, studyMode = false) => {
  let fullResponse = "";
  for await (const token of chatStream(message, history, image, modelKey, memory, studyMode)) {
    fullResponse += token;
  }
  return fullResponse || "Sem resposta do modelo.";
};

export const extractMemoryFacts = async (userMessage, assistantResponse) => {
  try {
    const response = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${MISTRAL_API_KEY}` },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: `Voce e um extrator de fatos. Analise a conversa e extraia APENAS fatos pessoais importantes sobre o usuario. Retorne APENAS JSON valido: [{"key":"nome_do_fato","value":"valor"}]. Se nao houver fatos, retorne [].` },
          { role: "user", content: `Usuario disse: "${userMessage}"\nAssistente respondeu: "${assistantResponse.substring(0, 500)}"` }
        ],
        stream: false,
        temperature: 0.3,
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) return [];
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch { return []; }
};

export const checkOllamaHealth = async () => true;
export const checkWhisperHealth = async () => false;

