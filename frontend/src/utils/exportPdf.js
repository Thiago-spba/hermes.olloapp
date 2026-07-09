import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MARGIN = 15;
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Detecta um bloco de tabela markdown (linhas comecando com |) dentro do texto
const isTableLine = (line) => /^\s*\|.*\|\s*$/.test(line);
const isTableSeparator = (line) => /^\s*\|?[\s:|-]+\|?\s*$/.test(line) && line.includes("-");

const parseMarkdownTable = (lines) => {
  const rows = lines
    .filter((l) => !isTableSeparator(l))
    .map((l) =>
      l
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    );
  return { head: [rows[0] || []], body: rows.slice(1) };
};

// Remove marcacao markdown simples (negrito/itálico/código) para texto plano legivel
const stripInlineMarkdown = (text) =>
  text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#+\s*/, "");

// Monta o documento PDF e retorna a instancia jsPDF (sem salvar/baixar) --
// separado para poder ser testado fora do navegador
export const buildMessagePdf = (message, opts = {}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const addTitle = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(opts.title || "HERMES", MARGIN, y);
    y += 6;
    doc.setDrawColor(150);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 8;
  };

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  addTitle();

  const lines = String(message.content || "").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (isTableLine(line)) {
      const tableLines = [];
      while (i < lines.length && isTableLine(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      const { head, body } = parseMarkdownTable(tableLines);
      autoTable(doc, {
        startY: y,
        head,
        body,
        margin: { left: MARGIN, right: MARGIN },
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [0, 153, 187] },
      });
      y = doc.lastAutoTable.finalY + 6;
      continue;
    }

    if (!line.trim()) {
      y += 4;
      i++;
      continue;
    }

    const isHeader = /^#{1,3}\s/.test(line);
    doc.setFont("helvetica", isHeader ? "bold" : "normal");
    doc.setFontSize(isHeader ? 13 : 11);

    const clean = stripInlineMarkdown(line);
    const wrapped = doc.splitTextToSize(clean, CONTENT_WIDTH);
    for (const w of wrapped) {
      ensureSpace(7);
      doc.text(w, MARGIN, y);
      y += 6;
    }
    if (isHeader) y += 2;
    i++;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(150);
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.text(`Hermes AI Agent - pagina ${p}/${pageCount}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 8, { align: "center" });
  }

  return doc;
};

export const exportMessageToPdf = (message, opts = {}) => {
  const doc = buildMessagePdf(message, opts);
  const filename = (opts.filename || "hermes-resposta") + ".pdf";
  doc.save(filename);
};
