// Monta o nome que a conversa recebe no historico.
// Regra: no Modo Aula, usa a linha "TITULO: 8º D - Monomios e polinomios" que
// a propria resposta traz. Fora dele, resume a primeira mensagem do usuario:
// corta na primeira pontuacao forte, limita o tamanho sem cortar palavra no
// meio e nao deixa reticencias. Nao gasta nenhum token de IA.

const PREFIXOS =
  /^(me explica|me explique|o que é|o que são|como funciona|como fazer|qual é|quais são|fale sobre|explica|explique|define|definição de|me fala sobre|me diz|quero saber|preciso de|pode fazer|faz|faça|monta|monte|cria|crie|gera|gere)\s+/i;

const LIMITE = 48;

const texto = (content) => {
  if (typeof content === "string") return content;
  if (Array.isArray(content))
    return content.filter((c) => c.type === "text").map((c) => c.text).join(" ");
  return "";
};

// Corta sem partir palavra e sem reticencias.
const encurtar = (s, limite = LIMITE) => {
  if (s.length <= limite) return s;
  const corte = s.slice(0, limite);
  const espaco = corte.lastIndexOf(" ");
  let r = (espaco > limite * 0.5 ? corte.slice(0, espaco) : corte).replace(/[\s,;:–-]+$/, "");
  // nao deixa palavrinha solta no fim ("... no cartao de")
  const SOLTAS = /\s+(de|do|da|dos|das|no|na|nos|nas|em|com|sem|por|para|pra|a|o|as|os|um|uma|uns|umas|meu|minha|seu|sua|e|ou|que|se|ao|aos|pelo|pela)$/i;
  let antes;
  do {
    antes = r;
    r = r.replace(SOLTAS, "");
  } while (r !== antes);
  return r;
};

const resumir = (bruto) => {
  let s = texto(bruto).trim();
  if (!s) return "";
  s = s.split("\n")[0].trim(); // so a primeira linha
  s = s.replace(PREFIXOS, "").trim();
  // para na primeira pontuacao forte: ":" "?" "!" "." (mas nao em "8.5" nem "1º")
  const m = s.match(/^[^:?!]*?(?=[:?!]|\.\s|\.$)/);
  if (m && m[0].trim().length >= 12) s = m[0].trim();
  s = s.replace(/[\s,;:–-]+$/, "");
  s = encurtar(s);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
};

// messages: lista com { role, content }
export const gerarTitulo = (messages) => {
  if (!Array.isArray(messages)) return "Nova conversa";
  // Modo Aula: a 1a linha da resposta vem como "TITULO: 8º D - Monomios e polinomios"
  for (const m of messages) {
    if (m?.role !== "assistant") continue;
    const c = texto(m.content);
    if (!/^\s*T[ÍI]TULO:/i.test(c)) continue;
    const t = c.trim().split("\n")[0].replace(/^\s*T[ÍI]TULO:\s*/i, "").trim();
    if (t) return encurtar(t, 60);
  }
  const primeira = messages.find((m) => m?.role === "user");
  if (!primeira) return "Nova conversa";
  return resumir(primeira.content) || "Nova conversa";
};

export default gerarTitulo;
