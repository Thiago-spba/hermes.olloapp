// Converte a resposta do Hermes (Markdown + LaTeX) em texto limpo, pronto para
// colar no WhatsApp, e-mail ou caderno: sem #, **, $ e com a matematica escrita
// como no quadro (x², 10/2, 3 · 2).

const SUP = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "−": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  n: "ⁿ", x: "ˣ", y: "ʸ", i: "ⁱ", a: "ᵃ", b: "ᵇ", m: "ᵐ", k: "ᵏ", t: "ᵗ",
};
const SUB = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };

const SIMBOLOS = {
  cdot: "·", times: "×", div: "÷", pm: "±", mp: "∓", leq: "≤", le: "≤", geq: "≥", ge: "≥",
  neq: "≠", ne: "≠", approx: "≈", pi: "π", infty: "∞", circ: "°", degree: "°",
  rightarrow: "→", to: "→", Rightarrow: "⇒", leftarrow: "←", alpha: "α", beta: "β", gamma: "γ",
  theta: "θ", delta: "δ", Delta: "Δ", sum: "∑", cdots: "…", ldots: "…", dots: "…",
  angle: "∠", triangle: "△", perp: "⊥", parallel: "∥", in: "∈", cup: "∪", cap: "∩",
};

// Le um "argumento": {grupo}, \comando ou um unico caractere
function pegar(s, i) {
  while (s[i] === " ") i++;
  if (s[i] === "{") {
    let nivel = 0;
    for (let j = i; j < s.length; j++) {
      if (s[j] === "{") nivel++;
      else if (s[j] === "}") {
        nivel--;
        if (nivel === 0) return [s.slice(i + 1, j), j + 1];
      }
    }
    return [s.slice(i + 1), s.length];
  }
  if (s[i] === "\\") {
    const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
    return [m[0], i + m[0].length];
  }
  return [s[i] ?? "", i + 1];
}

const simples = (t) => /^-?[\d.,]+$/.test(t) || /^[A-Za-z]$/.test(t);
const embrulhar = (t) => (simples(t) ? t : `(${t})`);

function expoente(e) {
  if (e === "°") return "°";
  if (e.length === 1 && SUP[e]) return SUP[e];
  if (/^\d+$/.test(e)) return `^${e}`;
  if (e.startsWith("(") && e.endsWith(")")) return `^${e}`;
  return `^(${e})`;
}

function indice(e) {
  if (/^\d+$/.test(e)) return [...e].map((d) => SUB[d]).join("");
  return `_${e}`;
}

export function latexParaTexto(s) {
  let out = "";
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === "\\") {
      const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
      const nome = m[1];
      i += m[0].length;
      if (nome === "frac" || nome === "dfrac" || nome === "tfrac") {
        let a, b;
        [a, i] = pegar(s, i);
        [b, i] = pegar(s, i);
        out += `${embrulhar(latexParaTexto(a))}/${embrulhar(latexParaTexto(b))}`;
      } else if (nome === "sqrt") {
        let a;
        [a, i] = pegar(s, i);
        const t = latexParaTexto(a);
        out += "√" + (simples(t) ? t : `(${t})`);
      } else if (["text", "mathrm", "textbf", "mathbf", "operatorname"].includes(nome)) {
        let a;
        [a, i] = pegar(s, i);
        out += a;
      } else if (nome === "left" || nome === "right") {
        // descarta; o delimitador que vem depois permanece
      } else if (["quad", "qquad", ",", ";", ":", " "].includes(nome)) {
        out += " ";
      } else if (nome === "!") {
        // espaco negativo: ignora
      } else if (["%", "$", "{", "}", "&", "#", "_"].includes(nome)) {
        out += nome;
      } else if (SIMBOLOS[nome]) {
        out += SIMBOLOS[nome];
      } else {
        out += nome; // comando desconhecido: mantem o nome sem a barra
      }
    } else if (c === "^") {
      let e;
      [e, i] = pegar(s, i + 1);
      out += expoente(latexParaTexto(e));
    } else if (c === "_") {
      let e;
      [e, i] = pegar(s, i + 1);
      out += indice(latexParaTexto(e));
    } else if (c === "{" || c === "}") {
      i++;
    } else {
      out += c;
      i++;
    }
  }
  return out.replace(/[ \t]{2,}/g, " ").trim();
}

export function paraTextoLimpo(md) {
  if (!md) return "";
  let t = String(md).replace(/\r\n/g, "\n");

  // 1) Matematica primeiro (para o Markdown nao mexer nela)
  t = t.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => `\n${latexParaTexto(m)}\n`);
  t = t.replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => `\n${latexParaTexto(m)}\n`);
  t = t.replace(/\\\(([\s\S]+?)\\\)/g, (_, m) => latexParaTexto(m));
  // $...$ so quando nao ha espaco colado nos $ (evita confundir com "R$ 2,00")
  t = t.replace(/\$(?=\S)([^$\n]*?\S)\$/g, (_, m) => latexParaTexto(m));

  // 2) Markdown
  t = t.replace(/^```[^\n]*\n([\s\S]*?)```/gm, "$1");
  t = t.replace(/^[ \t]{0,3}#{1,6}[ \t]+(.*)$/gm, "$1");
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, "$1");
  t = t.replace(/\*\*(.+?)\*\*/g, "$1");
  t = t.replace(/__(.+?)__/g, "$1");
  t = t.replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, "$1$2");
  t = t.replace(/`([^`\n]+)`/g, "$1");
  t = t.replace(/^[ \t]*>[ \t]?/gm, "");
  t = t.replace(/^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/gm, "");
  t = t.replace(/^([ \t]*)[*+][ \t]+/gm, "$1- ");

  // 3) Tabelas: tira a linha de tracos e as barras das pontas
  t = t
    .split("\n")
    .filter((l) => !(/^\s*\|?[\s:|-]+\|?\s*$/.test(l) && /-/.test(l) && l.includes("|")))
    .map((l) => (/^\s*\|.*\|\s*$/.test(l) ? l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim()).join(" | ") : l))
    .join("\n");

  // 4) Limpeza final
  t = t.replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  return t;
}
