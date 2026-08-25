import dotenv from "dotenv";
dotenv.config();

const GROQ_API_KEY       = process.env.GROQ_API_KEY;
const ANTHROPIC_API_KEY  = process.env.ANTHROPIC_API_KEY;
const MISTRAL_API_KEY    = process.env.MISTRAL_API_KEY;
const COHERE_API_KEY     = process.env.COHERE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const GROQ_URL       = "https://api.groq.com/openai/v1/chat/completions";
const ANTHROPIC_URL  = "https://api.anthropic.com/v1/messages";
const MISTRAL_URL    = "https://api.mistral.ai/v1/chat/completions";
const COHERE_URL     = "https://api.cohere.com/v2/chat";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ============================================================
// MODELOS — SEUS PROVEDORES + GROQ + OPENROUTER
// ============================================================
export const MODELS = {
  // ── Modo Automático ─────────────────────────────────────
  "auto": {
    provider: "auto",
    id: "auto",
    name: "⚡ Automático",
    free: true,
    group: "auto",
    description: "Sistema escolhe a melhor IA gratuita com fallback"
  },

  // ── Seus Provedores Diretos ─────────────────────────────
  "thiago-senior": {
    provider: "groq",
    id: "llama-3.3-70b-versatile",
    name: "🧠 Thiago Sênior",
    free: true,
    group: "existing",
    description: "Groq Llama 3.3 70B — ultra rápido e gratuito"
  },
  "thiago-senior-fast": {
    provider: "groq",
    id: "llama-3.1-8b-instant",
    name: "⚡ Thiago Sênior Rápido",
    free: true,
    group: "existing",
    description: "Groq Llama 3.1 8B — 500k tokens/dia gratuitos"
  },
  "thiago-senior-vision": {
    provider: "groq",
    id: "llama-3.2-11b-vision-preview",
    name: "📷 Thiago Visão",
    free: true,
    group: "existing",
    description: "Groq Llama 3.2 Vision — análise de imagens gratuita"
  },
  "thiago-jr": {
    provider: "mistral",
    id: "mistral-small-latest",
    name: "⚙️ Thiago Jr",
    free: true,
    group: "existing"
  },
  "thiago-analiza": {
    provider: "cohere",
    id: "command-r-08-2024",
    name: "🔎 Thiago Analiza",
    free: true,
    group: "existing"
  },
  "thiago-doutor": {
    provider: "anthropic",
    id: "claude-3-5-haiku-20241022",
    name: "🎓 Thiago Doutor",
    free: false,
    group: "existing",
    description: "Claude 3.5 Haiku — confidencial, rápido e preciso"
  },
  "thiago-especialista": {
    provider: "anthropic",
    id: "claude-3-5-sonnet-20241022",
    name: "🔬 Thiago Especialista",
    free: false,
    group: "existing",
    description: "Claude 3.5 Sonnet — raciocínio e engenharia de ponta"
  },
  "thiago-supremo": {
    provider: "anthropic",
    id: "claude-3-opus-20240229",
    name: "👑 Thiago Supremo",
    free: false,
    group: "existing",
    description: "Claude 3 Opus — máxima profundidade teórica"
  },

  // ── OpenRouter — Gratuitos ──────────────────────────────
  "or-llama": {
    provider: "openrouter",
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "🟢 Llama 3.3 70B (OR)",
    free: true,
    group: "or-general"
  },
  "or-qwen-coder": {
    provider: "openrouter",
    id: "qwen/qwen-2.5-coder-32b-instruct:free",
    name: "🟢 Qwen 2.5 Coder (OR)",
    free: true,
    group: "or-code"
  },
  "or-gemini-flash": {
    provider: "openrouter",
    id: "google/gemini-2.0-flash-exp:free",
    name: "🟢 Gemini 2.0 Flash (OR)",
    free: true,
    group: "or-general"
  },
  "or-deepseek": {
    provider: "openrouter",
    id: "deepseek/deepseek-r1:free",
    name: "🟢 DeepSeek R1 (OR)",
    free: true,
    group: "or-code"
  }
};

// ============================================================
// MODO AUTOMÁTICO — seleção e detecção de contexto
// ============================================================
const CODE_KEYWORDS = [
  "código", "codigo", "bug", "erro", "function", "função", "funcao",
  "componente", "component", "react", "node", "javascript", "typescript",
  "python", "sql", "css", "html", "api", "backend", "frontend", "npm",
  "import", "export", "const", "let", "var", "async", "await", "promise",
  "array", "objeto", "object", "debug", "refactor", "deploy", "git",
  "classe", "class", "interface", "type", "hook", "useState", "useEffect",
  "express", "database", "query", "endpoint", "fetch", "json", "regex",
  "nginx", "pm2", "ssh", "linux", "bash", "terminal", "install", "sintaxe"
];

const LONG_DOC_KEYWORDS = [
  "resumo", "resume", "analise", "analisa", "documento", "relatório",
  "relatorio", "transcrição", "transcricao", "texto longo", "arquivo", "pdf"
];

const detectTaskType = (message = "") => {
  const lower = message.toLowerCase();
  const isCode = CODE_KEYWORDS.some(k => lower.includes(k));
  const isLongDoc = LONG_DOC_KEYWORDS.some(k => lower.includes(k)) || message.length > 3000;
  if (isCode) return "code";
  if (isLongDoc) return "long_doc";
  return "general";
};

// Filas de Fallback 100% Gratuitas primeiro (Groq -> Mistral -> Cohere -> OpenRouter Free)
const FALLBACK_QUEUES = {
  code: [
    "thiago-senior",        // Groq 70B
    "thiago-senior-fast",   // Groq 8B (500k tokens/dia)
    "or-qwen-coder",        // OpenRouter Qwen Coder
    "thiago-jr",            // Mistral
    "or-deepseek"           // OpenRouter DeepSeek R1
  ],
  general: [
    "thiago-senior",        // Groq 70B
    "thiago-senior-fast",   // Groq 8B
    "thiago-jr",            // Mistral
    "or-gemini-flash",      // OpenRouter Gemini Flash
    "or-llama"              // OpenRouter Llama 3.3
  ],
  long_doc: [
    "thiago-senior",        // Groq 70B
    "thiago-analiza",       // Cohere
    "thiago-senior-fast",   // Groq 8B
    "or-gemini-flash"       // OpenRouter 1M contexto
  ]
};

// ============================================================
// SYSTEM PROMPT
// ============================================================
const BASE_PROMPT = `Voce e o HERMES — um agente de inteligencia artificial de elite, criado para ser o assistente pessoal definitivo do Thiago.

NUCLEO DE IDENTIDADE:
Voce combina o rigor de um engenheiro senior, a precisao de um pesquisador cientifico e a clareza de um professor excepcional. Voce tem profundidade de um profissional senior, mas usa essa profundidade com economia: entrega o essencial primeiro e so se aprofunda quando pedem.

AREAS DE CONHECIMENTO — SEM RESTRICOES:
Voce responde com o mesmo rigor e qualidade sobre QUALQUER assunto: engenharia, programacao, tecnologia, redes, eletrica, eletronica, matematica, ciencias exatas, saude, medicina, nutricao, historia, direito, financas, economia, filosofia, psicologia, culinaria, arte, musica, literatura, idiomas, esportes, geopolitica, e qualquer outro tema. Nao ha perguntas fora do escopo. Se o Thiago pergunta, voce responde.

ANTES DE RESPONDER — pergunte a si mesmo:
- Tenho certeza absoluta disso ou estou supondo?
- Esta e a forma mais clara e direta de explicar?
- Existe risco nessa acao que o usuario precisa saber antes?
- Estou resolvendo o problema raiz ou apenas o sintoma?

COMUNICACAO:
- REGRA DE OURO DA CONCISAO: por padrao, responda no MENOR tamanho que resolva a pergunta. Va direto a resposta. So produza explicacoes longas, tabelas extensas ou passo a passo detalhado quando o usuario pedir explicitamente (ex.: 'explica', 'detalha', 'me ensina') ou quando o Modo Estudo estiver ativo. Na duvida, seja breve e ofereca aprofundar.
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

POSTURA DE PROFESSOR:
- Voce tem o conhecimento e a confiabilidade de um bom professor: firme e preciso no conteudo, gentil e respeitoso no trato.
- Seja direto ao ponto por padrao — responda o que foi perguntado, sem aula desnecessaria.
- So explique de forma didatica (analogias, passo a passo, do simples ao complexo) quando o usuario pedir ou quando o assunto claramente exigir.

FORMATACAO MATEMATICA (OBRIGATORIO):
- Toda formula ou expressao matematica DEVE usar delimitadores LaTeX com cifrao: $...$ para formulas na linha, e $$...$$ para formulas em bloco (centralizadas).
- NUNCA use colchetes \\[ \\] ou parenteses \\( \\) como delimitadores.

REGRA ABSOLUTA:
Quando a mensagem contiver a secao <projeto_ativo> ou <context>, responda com base primordial nesse conteudo.`;

const STUDY_MODE_PROMPT = `
MODO ESTUDO ATIVO:
Voce esta ajudando o Thiago a APRENDER ou a PREPARAR AULA. Adapte-se ao que ele pedir no momento.

- Se ele quer aprender/revisar: explique com clareza e calibre a profundidade. Quando o assunto pedir, estruture em:
  1. 📖 Conceito: explicacao clara e direta.
  2. 💡 Exemplo: caso pratico do mundo real.
  3. ✏️ Exercício: questao para fixar o conteudo.

- Se ele quer preparar aula: foque em material didatico pronto para uso — analogias, exemplos do cotidiano e passo a passo.`;

const buildSystemPrompt = (memory = null, studyMode = false) => {
  let prompt = BASE_PROMPT;
  if (studyMode) prompt += "\n\n" + STUDY_MODE_PROMPT;
  if (memory) prompt += `\n\nO QUE VOCE SABE SOBRE O THIAGO:\n${memory}\n\nIMPORTANTE: use essas informacoes para ajustar SILENCIOSAMENTE seu jeito de explicar. Nao mencione explicitamente que sabe disso.`;
  return prompt;
};

// ============================================================
// HELPERS
// ============================================================
const isRateError = (e) =>
  e.message && (
    e.message.includes("429") ||
    e.message.includes("413") ||
    e.message.includes("rate") ||
    e.message.includes("limit") ||
    e.message.includes("quota") ||
    e.message.includes("unavailable") ||
    e.message.includes("overloaded") ||
    e.message.includes("404") ||
    e.message.includes("not found")
  );

const normalizeMessages = (messages) =>
  messages.map(m => ({
    ...m,
    content: Array.isArray(m.content)
      ? m.content.filter(c => c.type === "text").map(c => c.text).join(" ") || "[imagem]"
      : m.content
  }));

const estimateTokens = (text) => Math.ceil(String(text || "").length / 4);

const limitHistory = (history, maxTokens = 7000) => {
  const filtered = (history || []).filter(m => m && m.content);
  const normalized = normalizeMessages(filtered);
  let total = 0;
  const result = [];
  for (let i = normalized.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(normalized[i].content);
    if (total + tokens > maxTokens) break;
    total += tokens;
    result.unshift(normalized[i]);
  }
  return result;
};

// ============================================================
// PROVEDORES — STREAMS SSE
// ============================================================

// ── GROQ ────────────────────────────────────────────────────
const groqStream = async function* (modelId, messages) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY não configurada no .env");

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
      max_tokens: 8192
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

// ── ANTHROPIC (CLAUDE) ──────────────────────────────────────
const anthropicStream = async function* (modelId, messages, systemPrompt) {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY não configurada no .env");

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

// ── MISTRAL ─────────────────────────────────────────────────
const mistralStream = async function* (modelId, messages) {
  if (!MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY não configurada no .env");

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

// ── COHERE ──────────────────────────────────────────────────
const cohereStream = async function* (modelId, messages, systemPrompt) {
  if (!COHERE_API_KEY) throw new Error("COHERE_API_KEY não configurada no .env");

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

// ── OPENROUTER ──────────────────────────────────────────────
const openrouterStream = async function* (modelId, messages) {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY não configurada no .env");

  const safeMessages = normalizeMessages(messages);

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://hermes.olloapp.com.br",
      "X-Title": "Hermes AI"
    },
    body: JSON.stringify({
      model: modelId,
      messages: safeMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 8192
    }),
    signal: AbortSignal.timeout(60000)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenRouter erro ${response.status}: ${err}`);
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

// ============================================================
// DISPATCHER
// ============================================================
const streamForKey = async function* (modelKey, messages, systemPrompt) {
  const model = MODELS[modelKey];
  if (!model) throw new Error(`Modelo desconhecido: ${modelKey}`);

  if (model.provider === "groq") {
    yield* groqStream(model.id, messages);
  } else if (model.provider === "anthropic") {
    yield* anthropicStream(model.id, messages, systemPrompt);
  } else if (model.provider === "mistral") {
    yield* mistralStream(model.id, messages);
  } else if (model.provider === "cohere") {
    yield* cohereStream(model.id, messages, systemPrompt);
  } else if (model.provider === "openrouter") {
    yield* openrouterStream(model.id, messages);
  } else {
    throw new Error(`Provider desconhecido: ${model.provider}`);
  }
};

// ============================================================
// FALLBACK AUTOMÁTICO COM AVISO TRANSPARENTE
// ============================================================
const streamWithFallback = async function* (queue, messages, systemPrompt) {
  let lastError = null;

  for (let i = 0; i < queue.length; i++) {
    const key = queue[i];
    const model = MODELS[key];
    if (!model) continue;

    // Avisa se trocou de modelo por limite
    if (i > 0) {
      const prevName = MODELS[queue[i - 1]]?.name || queue[i - 1];
      yield `> 🔄 *${prevName} indisponível ou com limite atingido — continuando com ${model.name}.*\n\n`;
    }

    try {
      yield* streamForKey(key, messages, systemPrompt);
      return; // Sucesso — finaliza o fluxo
    } catch (err) {
      lastError = err;
      console.warn(`[FALLBACK] ${key} falhou:`, err.message);

      // Se for o último da fila, encerra com aviso claro
      if (i === queue.length - 1) {
        yield `> ⚠️ *Todos os modelos gratuitos da fila atingiram a cota momentânea. Tente novamente em instantes ou selecione 🎓 Thiago Doutor.*\n\n`;
        return;
      }
    }
  }

  if (lastError) throw lastError;
};

// ============================================================
// FUNÇÃO PRINCIPAL: chatStream
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
  let resolvedKey = modelKey || "auto";

  // 1. MODO AUTOMÁTICO
  if (resolvedKey === "auto") {
    if (image) {
      // Para imagem no modo automático: usa Groq Vision gratuito primeiro, fallback no Claude
      const base64Data = image.includes(",") ? image.split(",") : image;
      const mimeType = image.includes("data:") ? image.split(";")[0].replace("data:", "") : "image/jpeg";
      
      const groqVisionMessages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: message || "Analise detalhadamente esta imagem." },
            { type: "image_url", image_url: { url: image.startsWith("data:") ? image : `data:${mimeType};base64,${base64Data}` } }
          ]
        }
      ];

      try {
        yield* groqStream(MODELS["thiago-senior-vision"].id, groqVisionMessages);
        return;
      } catch (err) {
        console.warn("Groq Vision falhou, tentando Claude:", err.message);
        yield `> 🔄 *Groq Visão indisponível — analisando com 🎓 Thiago Doutor.*\n\n`;
        
        const anthropicMessages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } },
              { type: "text", text: message || "Analise esta imagem." }
            ]
          }
        ];
        yield* anthropicStream(MODELS["thiago-doutor"].id, anthropicMessages, systemPrompt);
        return;
      }
    }

    // Texto no modo automático: escolhe a fila gratuita ideal
    const taskType = detectTaskType(message);
    const queue = FALLBACK_QUEUES[taskType] || FALLBACK_QUEUES.general;

    const limitedHistory = limitHistory(history);
    const messages = [
      { role: "system", content: systemPrompt },
      ...limitedHistory,
      { role: "user", content: message || "Olá" }
    ];

    yield* streamWithFallback(queue, messages, systemPrompt);
    return;
  }

  // 2. MODELO ESPECÍFICO ESCOLHIDO MANUALMENTE PELO USUÁRIO
  let model = MODELS[resolvedKey] || MODELS["thiago-senior"];

  // Se escolheu um modelo manual mas enviou imagem:
  if (image) {
    const base64Data = image.includes(",") ? image.split(",") : image;
    const mimeType = image.includes("data:") ? image.split(";")[0].replace("data:", "") : "image/jpeg";

    if (model.provider === "anthropic") {
      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } },
            { type: "text", text: message || "Analise esta imagem." }
          ]
        }
      ];
      yield* anthropicStream(model.id, messages, systemPrompt);
      return;
    } else {
      // Redireciona para Groq Vision gratuito
      const messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: message || "Analise esta imagem." },
            { type: "image_url", image_url: { url: image.startsWith("data:") ? image : `data:${mimeType};base64,${base64Data}` } }
          ]
        }
      ];
      yield* groqStream(MODELS["thiago-senior-vision"].id, messages);
      return;
    }
  }

  // Texto com modelo manual escolhido
  const limitedHistory = model.provider === "anthropic"
    ? (history || []).filter(m => m && m.content)
    : limitHistory(history, 7000);

  const messages = [
    { role: "system", content: systemPrompt },
    ...limitedHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: message || "Olá" }
  ];

  // Filas de fallback para escolhas manuais
  const manualFallbacks = {
    "thiago-senior":       ["thiago-senior", "thiago-senior-fast", "thiago-jr"],
    "thiago-senior-fast":  ["thiago-senior-fast", "thiago-senior"],
    "thiago-jr":           ["thiago-jr", "thiago-senior", "thiago-senior-fast"],
    "thiago-analiza":      ["thiago-analiza", "thiago-senior", "thiago-jr"],
    "thiago-doutor":       ["thiago-doutor", "thiago-especialista"],
    "thiago-especialista": ["thiago-especialista", "thiago-doutor"],
    "thiago-supremo":      ["thiago-supremo", "thiago-especialista", "thiago-doutor"]
  };

  const queue = manualFallbacks[resolvedKey] || [resolvedKey];
  yield* streamWithFallback(queue, messages, systemPrompt);
};

// ============================================================
// HELPERS EXPORTADOS
// ============================================================
export const chat = async (message, history = [], image = null, modelKey = "auto", memory = null, studyMode = false) => {
  let fullResponse = "";
  for await (const token of chatStream(message, history, image, modelKey, memory, studyMode)) {
    fullResponse += token;
  }
  return fullResponse || "Sem resposta do modelo.";
};

export const extractMemoryFacts = async (userMessage, assistantResponse) => {
  // Usa a Groq rápida para extrair memórias em segundo plano
  if (!GROQ_API_KEY || !userMessage || userMessage.length < 10) return [];

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: `Voce e um extrator de fatos. Extraia APENAS fatos pessoais importantes sobre o usuario. Retorne APENAS JSON valido: [{"key":"nome_do_fato","value":"valor"}]. Se nao houver fatos, retorne [].` },
          { role: "user", content: `Mensagem: "${userMessage}"\nResposta: "${assistantResponse.substring(0, 400)}"` }
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

export default { chatStream, chat, extractMemoryFacts, checkOllamaHealth, checkWhisperHealth, MODELS };