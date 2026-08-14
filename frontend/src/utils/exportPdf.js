import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Padrão ABNT: Margens Superior e Esquerda 3cm (30mm), Inferior e Direita 2cm (20mm)
const MARGIN_TOP = 30;
const MARGIN_LEFT = 30;
const MARGIN_BOTTOM = 20;
const MARGIN_RIGHT = 20;
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

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

// Monta o documento PDF e retorna a instancia jsPDF (sem salvar/baixar)
export const buildMessagePdf = (message, opts = {}) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN_TOP;

  // Insere título apenas se explicitamente solicitado (sem marcações fixas do sistema)
  const addTitle = () => {
    if (opts.title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(opts.title, MARGIN_LEFT, y);
      y += 10;
    }
  };

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      y = MARGIN_TOP;
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
        margin: { left: MARGIN_LEFT, right: MARGIN_RIGHT },
        styles: { font: "helvetica", fontSize: 10, cellPadding: 3, textColor: 0 },
        headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold" }, // Padrão acadêmico P/B
      });
      y = doc.lastAutoTable.finalY + 8;
      continue;
    }

    if (!line.trim()) {
      y += 6; // Simula espaçamento ABNT
      i++;
      continue;
    }

    const isHeader = /^#{1,3}\s/.test(line);
    doc.setFont("helvetica", isHeader ? "bold" : "normal");
    doc.setFontSize(12); // Padrão ABNT para texto
    doc.setTextColor(0);

    const clean = stripInlineMarkdown(line);
    const wrapped = doc.splitTextToSize(clean, CONTENT_WIDTH);
    for (const w of wrapped) {
      ensureSpace(7);
      doc.text(w, MARGIN_LEFT, y);
      y += 7; // Entrelinhas aproximado de 1.5
    }
    if (isHeader) y += 4;
    i++;
  }

  // --- Injeção da Assinatura Discreta ---
  ensureSpace(20); // Garante que há espaço para a assinatura na página atual
  y += 10;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(130); // Tom de cinza para não disputar atenção com o texto principal
  doc.text("Thiago Fernando | Engenheiro da Computação • Licenciado em Matemática", PAGE_WIDTH - MARGIN_RIGHT, y, { align: "right" });

  // --- Numeração de Páginas (Padrão ABNT) ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0);
    // ABNT: Numeração no canto superior direito (2cm do topo, 2cm da margem direita)
    doc.text(`${p}`, PAGE_WIDTH - MARGIN_RIGHT, 20, { align: "right" });
  }

  return doc;
};

export const exportMessageToPdf = (message, opts = {}) => {
  const doc = buildMessagePdf(message, opts);
  const filename = (opts.filename || "relatorio-tecnico") + ".pdf";
  doc.save(filename);
};