import dotenv from "dotenv";
dotenv.config();

const GROQ_API_KEY      = process.env.GROQ_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MISTRAL_API_KEY   = process.env.MISTRAL_API_KEY;
const COHERE_API_KEY    = process.env.COHERE_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const GROQ_URL       = "https://api.groq.com/openai/v1/chat/completions";
const ANTHROPIC_URL  = "https://api.anthropic.com/v1/messages";
const MISTRAL_URL    = "https://api.mistral.ai/v1/chat/completions";
const COHERE_URL     = "https://api.cohere.com/v2/chat";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ============================================================
// MODELOS — EXISTENTES + OPENROUTER
// ============================================================
export const MODELS = {
  // ── Modo Automático ─────────────────────────────────────
  "auto": {
    provider: "auto",
    id: "auto",
    name: "⚡ Automático",
    free: true,
    group: "auto",
    description: "Sistema escolhe a melhor IA para cada tarefa"
  },

  // ── OpenRouter — Especializados em Código ────────────────
  "or-qwen3-coder": {
    provider: "openrouter",
    id: "qwen/qwen3-coder:free",
    name: "🟢 Qwen3 Coder",
    free: true,
    group: "or-code",
    description: "#1 código gratuito — 1M contexto"
  },
  "or-north-mini": {
    provider: "openrouter",
    id: "cohere/north-mini-code:free",
    name: "🟢 North Mini Code",
    free: true,
    group: "or-code",
    description: "Especialista em agentes — 69 tok/s"
  },
  "or-laguna": {
    provider: "openrouter",
    id: "poolside/laguna-xs-2-1:free",
    name: "🟢 Laguna XS Code",
    free: true,
    group: "or-code",
    description: "Otimizado para coding agents"
  },
  "or-kimi-k3": {
    provider: "openrouter",
    id: "moonshotai/kimi-k3:free",
    name: "🟢 Kimi K3",
    free: true,
    group: "or-code",
    description: "2.8T params — top em código"
  },
  "or-gpt-oss": {
    provider: "openrouter",
    id: "openai/gpt-oss-120b:free",
    name: "🟢 GPT-OSS 120B",
    free: true,
    group: "or-code",
    description: "Open source OpenAI — 128K contexto"
  },

  // ── OpenRouter — Gerais ──────────────────────────────────
  "or-llama": {
    provider: "openrouter",
    id: "meta-llama/llama-3.3-70b-instruct:free",
    name: "🟢 Llama 3.3 70B",
    free: true,
    group: "or-general",
    description: "Mais estável — geral e conversação"
  },
  "or-nemotron": {
    provider: "openrouter",
    id: "nvidia/nemotron-3-ultra:free",
    name: "🟢 Nemotron Ultra",
    free: true,
    group: "or-general",
    description: "1M contexto — documentos longos"
  },
  "or-owl": {
    provider: "openrouter",
    id: "owl/alpha:free",
    name: "🟢 Owl Alpha",
    free: true,
    group: "or-general",
    description: "1M contexto — tarefas longas"
  },

  // ── OpenRouter — Pagos ───────────────────────────────────
  "or-kimi-k27": {
    provider: "openrouter",
    id: "moonshotai/kimi-k2-7:free",
    name: "💰 Kimi K2.7 Code",
    free: false,
    group: "or-paid",
    description: "Código avançado — pago"
  },

  // ── Seus Provedores Atuais ───────────────────────────────
  "thiago-analiza": {
    provider: "cohere",
    id: "command-a-03-2025",
    name: "🔎 Thiago Analiza",
    free: true,
    group: "existing"
  },
  "thiago-jr": {
    provider: "mistral",
    id: "mistral-small-latest",
    name: "⚙️ Thiago Jr",
    free: true,
    group: "existing"
  },
  "thiago-senior": {
    provider: "groq",
    id: "llama-3.3-70b-versatile",
    name: "🧠 Thiago Sênior",
    free: true,
    group: "existing"
  },
  "thiago-doutor": {
    provider: "anthropic",
    id: "claude-haiku-4-5-20251001",
    name: "🎓 Thiago Doutor",
    free: false,
    group: "existing"
  },
  "thiago-especialista": {
    provider: "anthropic",
    id: "claude-sonnet-4-6",
    name: "🔬 Thiago Especialista",
    free: false,
    group: "existing"
  },
  "thiago-supremo": {
    provider: "anthropic",
    id: "claude-opus-4-7",
    name: "👑 Thiago Supremo",
    free: false,
    group: "existing"
  },
};

// ============================================================
// MODO AUTOMÁTICO — lógica de seleção por contexto
// ============================================================

// Palavras-chave para detectar tarefas de código
const CODE_KEYWORDS = [
  "código", "codigo", "bug", "erro", "function", "função", "funcao",
  "componente", "component", "react", "node", "javascript", "typescript",
  "python", "sql", "css", "html", "api", "backend", "frontend", "npm",
  "import", "export", "const", "let", "var", "async", "await", "promise",
  "array", "objeto", "object", "debug", "refactor", "deploy", "git",
  "classe", "class", "interface", "type", "generics", "hook", "useState",
  "useEffect", "express", "fastify", "prisma", "database", "query",
  "endpoint", "fetch", "axios", "json", "parse", "regex", "script",
  "dockerfile", "nginx", "pm2", "ssh", "linux", "bash", "terminal",
  "instalar", "install", "package", "module", "import error", "sintaxe"
];

// Palavras-chave para documentos longos
const LONG_DOC_KEYWORDS = [
  "resumo", "resume", "analise", "analisa", "documento", "relatório",
  "relatorio", "transcrição", "transcricao", "texto longo", "arquivo"
];

const detectTaskType = (message = "") => {
  const lower = message.toLowerCase();
  const isCode = CODE_KEYWORDS.some(k => lower.includes(k));
  const isLongDoc = LONG_DOC_KEYWORDS.some(k => lower.includes(k)) || message.length > 3000;
  if (isCode) return "code";
  if (isLongDoc) return "long_doc";
  return "general";
};

// Fila de fallback por tipo de tarefa (gratuitos primeiro)
const FALLBACK_QUEUES = {
  code: [
    "or-qwen3-coder",
    "or-north-mini",
    "or-laguna",
    "or-kimi-k3",
    "or-gpt-oss",
    "thiago-senior",      // Groq — fallback existente
    "or-kimi-k27",        // pago — último recurso
  ],
  general: [
    "or-llama",
    "or-gpt-oss",
    "or-nemotron",
    "or-owl",
    "thiago-senior",
    "thiago-jr",
  ],
  long_doc: [
    "or-nemotron",        // 1M contexto
    "or-owl",             // 1M contexto
    "or-llama",
    "thiago-senior",
  ],
};

// ============================================================
// SYSTEM PROMPT
// ============================================================
const BASE_PROMPT = `Voce e o HERMES — um agente de inteligencia artificial de elite, criado para ser o assistente pessoal definitivo do Thiago.

NUCLEO DE IDENTIDADE:
Voce combina o rigor de um engenheiro senior, a precisao de um pesquisador cientifico e a clareza de um professor excepcional. Voce tem profundidade de um profissional senior, mas usa essa profundidade com economia: entrega o essencial primeiro e so se aprofunda quando pedem.

AREAS DE CONHECIMENTO — SEM RESTRICOES:
Voce responde com o mesmo rigor e qualidade sobre QUALQUER assunto: engenharia, programacao, tecnologia, redes, eletrica, eletronica, matematica, ciencias exatas, saude,medicina, nutricao, historia, direito, financas, economia, filosofia, psicologia, culinaria, arte, musica, literatura, idiomas, esportes, geopolitica, e qualquer outro tema. Nao ha perguntas fora do escopo. Se o Thiago pergunta, voce responde.

ANTES DE RESPONDER — pergunte a si mesmo:
- Tenho certeza absoluta disso ou estou suposicionando?
- Esta e a forma mais clara e direta de explicar?
- Existe risco nessa acao que o usuario precisa saber antes?
- Estou resolvendo o problema raiz ou apenas o sintoma?

COMUNICACAO:
- REGRA DE OURO DA CONCISAO: por padrao, responda no MENOR tamanho que resolva a pergunta. Va direto a resposta. So produza explicacoes longas, tabelas extensas ou passoa passo detalhado quando o usuario pedir explicitamente (ex.: 'explica', 'detalha', 'me ensina') ou quando o Modo Estudo estiver ativo. Na duvida, seja breve e ofereca aprofundar.
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
- So divida em etapas (e pergunte antes) se a tarefa for realmente longa/complexa OUse o usuario pedir explicitamente.
- Codigo: explique a logica ANTES de mostrar o codigo. Aponte riscos antes de executar.
- Debugging: identifique a causa raiz, nao apenas o sintoma. Proponha solucao definitiva.
- Calculos de engenharia: mostre o raciocinio completo, unidades e hipoteses assumidas.
- Quando houver multiplas solucoes validas: apresente as opcoes com trade-offs claros.

PROATIVIDADE:
- Se detectar um erro ou risco nao perguntado, aponte antes de responder o que foi pedido.
- Se a pergunta for ambigua, resolva a interpretacao mais provavel E pergunte se eraisso.
- Sugira a proxima etapa logica ao final de respostas tecnicas complexas.

POSTURA DE PROFESSOR:
- Voce tem o conhecimento e a confiabilidade de um bom professor: firme e preciso noconteudo, gentil e respeitoso no trato.
- Seja direto ao ponto por padrao — responda o que foi perguntado, sem aula desnecessaria.
- So explique de forma didatica (analogias, passo a passo, do simples ao complexo) quando o usuario pedir ou quando o assunto claramente exigir.
- Trate eventuais erros do usuario com respeito, corrigindo sem condescendencia.

HONESTIDADE ACIMA DE AGRADAR:
- Nunca concorde apenas para satisfazer. Se o usuario estiver errado, aponte com clareza e fundamente o porque.
- Sua funcao e ser confiavel, nao agradavel. Uma verdade incomoda vale mais que um elogio falso.
- Nao suavize fatos tecnicos para parecer simpatico.

FORMATACAO VISUAL:
- Formulas matematicas SEMPRE entre cifroes: $...$ na mesma linha, $$...$$ em bloco centralizado. NUNCA use colchetes ou parenteses com barra como delimitador.
- Comparacoes em tabela markdown com | coluna | coluna |.
- Codigo sempre em bloco, com a linguagem indicada.

FERRAMENTAS:
- Dados e comparacoes visuais: oferea gerar com Chart.js ou tabela markdown estruturada.
- Calculos complexos: mostre formula, substituicao numerica e resultado com unidades.
- Fontes confiaveis para verificacao: documentacao oficial, IEEE Xplore, MDN Web Docs, RFC, datasheets do fabricante.

FORMATACAO MATEMATICA (OBRIGATORIO):
- Toda formula ou expressao matematica DEVE usar delimitadores LaTeX com cifrao: $...$ para formulas na linha, e $$...$$ para formulas em bloco (centralizadas).
- NUNCA use colchetes \[ \] ou parenteses \( \) como delimitadores. NUNCA escreva formula sem cifrao.
- Exemplo correto: A hipotenusa segue $a^2 = b^2 + c^2$.

REGRA ABSOLUTA:
Quando a mensagem contiver a secao CONTEUDO, responda EXCLUSIVAMENTE com base nesse conteudo. Nunca alegue nao ter acesso a documentos quando o conteudo estiver presente.`;

const STUDY_MODE_PROMPT = `
MODO ESTUDO ATIVO:
Voce esta ajudando o Thiago a APRENDER ou a PREPARAR AULA. Adapte-se ao que ele pedir no momento.

- Se ele quer aprender/revisar: explique com clareza e calibre a profundidade ao nivel demonstrado por ele. Quando o assunto pedir, estruture em CONCEITO, EXEMPLO e EXERCICIO (com emojis de quadro, lampada e lapis). Em perguntas simples ou de esclarecimento rapido, responda direto, SEM forcar os tres blocos.

- Se ele quer preparar aula (mencionar alunos, sala de aula, ensinar): foque em material didatico pronto para uso — analogias, exemplos do cotidiano e passo a passo que ele possa aplicar com os alunos.

- No EXERCICIO, sempre se ofereca para conferir a resposta dele e dar uma dica caso ele erre.

REGRA: nunca empurre os tres blocos quando nao agregam. A estrutura serve ao aprendizado, nao o contrario.`;

const buildSystemPrompt = (memory = null, studyMode = false) => {
  let prompt = BASE_PROMPT;
  if (studyMode) prompt += STUDY_MODE_PROMPT;
  if (memory) prompt += `\n\nO QUE VOCE SABE SOBRE O THIAGO:\n${memory}\n\nIMPORTANTE: use essas informacoes para ajustar SILENCIOSAMENTE seu jeito de explicar (ex: evitar contas mentais complexas, ir direto ao ponto, usar exemplos praticos). NUNCA mencione, cite ou comente essas informacoes na resposta (nao diga "sei que voce tem dificuldade com X" ou similar), a menos que o Thiago pergunte diretamente sobre isso. Aja naturalmente, sem expor que sabe.`;
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
    e.message.includes("overloaded")
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
  const filtered = history.filter(m => m.content);
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
// PROVIDERS — STREAMS
// ============================================================

// ── GROQ ────────────────────────────────────────────────────
const groqStream = async function* (modelId, messages) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: modelId, messages, stream: true,
      temperature: 0.7, max_tokens: 8192
    }),
    signal: AbortSignal.timeout(60000)
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq erro ${response.status}: ${err}`);
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

// ── MISTRAL ─────────────────────────────────────────────────
const mistralStream = async function* (modelId, messages) {
  const response = await fetch(MISTRAL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: modelId, messages, stream: true,
      temperature: 0.7, max_tokens: 8192
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
      stream: true, temperature: 0.7, max_tokens: 8192
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

// ── ANTHROPIC ───────────────────────────────────────────────
const anthropicStream = async function* (modelId, messages, systemPrompt) {
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
      stream: true, max_tokens: 8192
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

// ── OPENROUTER ──────────────────────────────────────────────
const openrouterStream = async function* (modelId, messages) {
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
// DISPATCHER — chama o provider certo pelo modelKey
// ============================================================
const streamForKey = async function* (modelKey, messages, systemPrompt) {
  const model = MODELS[modelKey];
  if (!model) throw new Error(`Modelo desconhecido: ${modelKey}`);

  if (model.provider === "openrouter") {
    yield* openrouterStream(model.id, messages);
  } else if (model.provider === "anthropic") {
    yield* anthropicStream(model.id, messages, systemPrompt);
  } else if (model.provider === "groq") {
    yield* groqStream(model.id, messages);
  } else if (model.provider === "mistral") {
    yield* mistralStream(model.id, messages);
  } else if (model.provider === "cohere") {
    yield* cohereStream(model.id, messages, systemPrompt);
  } else {
    throw new Error(`Provider desconhecido: ${model.provider}`);
  }
};

// ============================================================
// FALLBACK COM ALERTA — percorre a fila automaticamente
// ============================================================
const streamWithFallback = async function* (queue, messages, systemPrompt, firstModelName) {
  let lastError = null;

  for (let i = 0; i < queue.length; i++) {
    const key = queue[i];
    const model = MODELS[key];
    if (!model) continue;

    // Avisa quando troca de modelo
    if (i > 0) {
      const prevName = MODELS[queue[i - 1]]?.name || queue[i - 1];
      yield `> 🔄 *${prevName} atingiu o limite — continuando com ${model.name}.*\n\n`;
    }

    // Avisa quando entra em modelo PAGO
    if (!model.free) {
      yield `> 💰 *Modelos gratuitos esgotados — usando ${model.name} (PAGO). Acompanhe o consumo em openrouter.ai.*\n\n`;
    }

    try {
      yield* streamForKey(key, messages, systemPrompt);
      return; // sucesso — para aqui
    } catch (err) {
      lastError = err;
      console.error(`[FALLBACK] ${key} falhou:`, err.message);

      // Se não for erro de limite, lança imediatamente
      if (!isRateError(err)) throw err;

      // Se for o último da fila, avisa e encerra
      if (i === queue.length - 1) {
        yield `> ⚠️ *Todos os modelos atingiram o limite. Tente novamente em alguns minutos.*\n\n`;
        return;
      }
      // Senão, continua para o próximo da fila
    }
  }

  if (lastError) throw lastError;
};

// ============================================================
// MAIN — chatStream
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

  // ── Resolve modelo ────────────────────────────────────────
  let resolvedKey = modelKey;

  // Modo Automático: detecta tipo de tarefa e monta fila
  if (modelKey === "auto" || !modelKey) {
    const taskType = detectTaskType(message);
    const queue = FALLBACK_QUEUES[taskType] || FALLBACK_QUEUES.general;

    // Monta mensagens
    const limitedHistory = limitHistory(history);
    const messages = [
      { role: "system", content: systemPrompt },
      ...limitedHistory,
    ];

    if (image) {
      // Imagem: usa Anthropic diretamente
      const base64Data = image.includes(",") ? image.split(",")[1] : image;
      const mimeType = image.includes("data:") ? image.split(";")[0].replace("data:", "") : "image/jpeg";
      messages.push({
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } },
          { type: "text", text: message || "Analise esta imagem." }
        ]
      });
      yield* anthropicStream(MODELS["thiago-doutor"].id, messages, systemPrompt);
      return;
    }

    messages.push({ role: "user", content: message || "Olá" });
    yield* streamWithFallback(queue, messages, systemPrompt, MODELS[queue[0]]?.name || queue[0]);
    return;
  }

  // ── Modelo específico escolhido pelo usuário ──────────────
  const model = MODELS[resolvedKey] || MODELS["thiago-doutor"];

  // Imagem: redireciona para Anthropic se provider não suporta
  if (image && !["anthropic"].includes(model.provider)) {
    yield `> 📷 *${model.name} não suporta imagens — redirecionando para 🎓 Thiago Doutor.*\n\n`;
    resolvedKey = "thiago-doutor";
  }

  const limitedHistory = model.provider === "anthropic"
    ? history.filter(m => m.content)
    : limitHistory(history, 7000);

  const messages = [
    { role: "system", content: systemPrompt },
    ...limitedHistory.map(m => ({ role: m.role, content: m.content }))
  ];

  if (image) {
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeType = image.includes("data:") ? image.split(";")[0].replace("data:", "") : "image/jpeg";
    if (MODELS[resolvedKey]?.provider === "anthropic") {
      messages.push({
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mimeType, data: base64Data } },
          { type: "text", text: message || "Analise esta imagem." }
        ]
      });
    }
  } else {
    messages.push({ role: "user", content: message || "Olá" });
  }

  // Executa com fallback para modelos existentes
  const existingFallbacks = {
    "thiago-doutor":       ["thiago-doutor",       "thiago-jr"],
    "thiago-especialista": ["thiago-especialista",  "thiago-doutor", "thiago-jr"],
    "thiago-supremo":      ["thiago-supremo",       "thiago-especialista", "thiago-doutor"],
    "thiago-analiza":      ["thiago-analiza",       "thiago-jr"],
    "thiago-jr":           ["thiago-jr",            "thiago-senior"],
    "thiago-senior":       ["thiago-senior",        "thiago-jr"],
  };

  const orFallback = {
    "or-qwen3-coder": ["or-qwen3-coder", "or-north-mini", "or-gpt-oss", "thiago-senior"],
    "or-north-mini":  ["or-north-mini",  "or-laguna",     "or-gpt-oss", "thiago-senior"],
    "or-laguna":      ["or-laguna",      "or-gpt-oss",    "thiago-senior"],
    "or-kimi-k3":     ["or-kimi-k3",     "or-qwen3-coder","thiago-senior"],
    "or-gpt-oss":     ["or-gpt-oss",     "thiago-senior", "thiago-jr"],
    "or-llama":       ["or-llama",       "or-gpt-oss",    "thiago-senior"],
    "or-nemotron":    ["or-nemotron",    "or-owl",        "or-llama"],
    "or-owl":         ["or-owl",         "or-nemotron",   "or-llama"],
    "or-kimi-k27":    ["or-kimi-k27",    "thiago-especialista"],
  };

  const queue = existingFallbacks[resolvedKey] || orFallback[resolvedKey] || [resolvedKey];
  yield* streamWithFallback(queue, messages, systemPrompt, model.name);
};

// ============================================================
// HELPERS exportados
// ============================================================
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
        stream: false, temperature: 0.3, max_tokens: 500
      }),
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) return [];
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "[]";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch { return []; }
};

export const checkOllamaHealth = async () => true;
export const checkWhisperHealth = async () => false;