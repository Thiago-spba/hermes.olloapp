import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Escapa caracteres especiais de regex em uma string
 * @param {string} str - String a ser escapada
 * @returns {string} String com metacaracteres escapados
 */
const escapeRegex = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const extractPdfText = async (base64Data) => {
  const buffer = Buffer.from(base64Data, "base64");
  const data = await pdfParse(buffer);
  return data.text;
};

export const chunkText = (text, chunkSize = 4000) => {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return chunks;
};

export const findRelevantChunks = (chunks, query, maxChunks = 3) => {
  const queryWords = query.toLowerCase().split(" ").filter(w => w.length > 3);
  const scored = chunks.map((chunk, index) => {
    const chunkLower = chunk.toLowerCase();
    const score = queryWords.reduce((acc, word) => {
      const escapedWord = escapeRegex(word);
      const matches = (chunkLower.match(new RegExp(escapedWord, "g")) || []).length;
      return acc + matches;
    }, 0);
    return { chunk, score, index };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .sort((a, b) => a.index - b.index)
    .map(item => item.chunk);
};