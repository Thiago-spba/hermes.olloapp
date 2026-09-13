// Cadastro dos templates de documento acadêmico disponíveis no Hermes.
//
// Para adicionar um novo template no futuro (TCC, Declaração, etc.):
// 1. Mande o PDF de exemplo no chat com o Claude.
// 2. Ele extrai a imagem de fundo e as posições exatas do texto.
// 3. Uma nova entrada é adicionada aqui em PDF_TEMPLATES, sem mexer em mais nada.
//
// Cada template define: uma imagem de fundo (papel timbrado, repetida em
// todas as páginas), uma função drawHeader (desenha o cabeçalho de
// identificação na primeira página e devolve o Y em mm onde o conteúdo do
// trabalho deve começar) e valores padrão para os campos que não mudam
// entre trabalhos (curso, registro acadêmico, nome do aluno).

import capaCelsoLisboaBg from "../assets/capa-celso-lisboa-bg.jpg?inline";

const PAGE_WIDTH = 210; // A4 mm
const MARGIN_LEFT = 30;
const MARGIN_RIGHT = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const pt2mm = (pt) => pt * 0.352778;

// --- Template: Centro Universitário Celso Lisboa ---
// Layout extraído de um trabalho real entregue pelo Thiago (Fase 2 - Atividade
// Prática 2), coordenadas medidas em pontos PDF e convertidas para mm.
const drawHeaderCelsoLisboa = (doc, fields = {}) => {
  const {
    curso = "Engenharia de Computação",
    turma = "",
    registroAcademico = "24113801",
    professor = "",
    nome = "Thiago F. A. A. dos Santos",
    fase = "",
    tituloTrabalho = "",
  } = fields;

  doc.setTextColor(0, 0, 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("CENTRO UNIVERSITÁRIO CELSO LISBOA", PAGE_WIDTH / 2, pt2mm(152.2) + 6, { align: "center" });

  doc.setFontSize(12);
  if (fase) doc.text(fase, PAGE_WIDTH / 2, pt2mm(191.2) + 4.2, { align: "center" });

  let y = pt2mm(219.7) + 4.2;
  const tituloLines = doc.splitTextToSize(String(tituloTrabalho || "").toUpperCase(), CONTENT_WIDTH + 20);
  for (const line of tituloLines) {
    doc.text(line, PAGE_WIDTH / 2, y, { align: "center" });
    y += 5.86; // ~16.6pt de entrelinha, igual ao modelo original
  }

  y += 12.5; // espaco entre titulo e bloco de metadados (independe do numero de linhas do titulo)
  const LINE_GAP = pt2mm(19); // espacamento entre linhas do bloco de metadados, igual ao modelo original

  doc.setFont("helvetica", "bold");
  doc.text("Curso:", MARGIN_LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(` ${curso}    Turma: ${turma}`, MARGIN_LEFT + pt2mm(38.6), y);

  y += LINE_GAP;
  doc.setFont("helvetica", "bold");
  doc.text("Registro acadêmico -", MARGIN_LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(` ${registroAcademico}`, MARGIN_LEFT + pt2mm(121.3), y);

  y += LINE_GAP;
  doc.setFont("helvetica", "bold");
  doc.text("Professor:", MARGIN_LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(` ${professor}`, MARGIN_LEFT + pt2mm(60), y);

  y += LINE_GAP;
  doc.setFont("helvetica", "bold");
  doc.text("Nome:", MARGIN_LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(` ${nome}`, MARGIN_LEFT + pt2mm(37.3), y);

  return y + pt2mm(33.9); // espaco antes do conteudo comecar, igual ao modelo original
};

// Cadastro central de todos os templates disponiveis.
// A chave (ex: "celso-lisboa") e o templateId usado em toda a aplicacao.
export const PDF_TEMPLATES = {
  "celso-lisboa": {
    id: "celso-lisboa",
    name: "Centro Universitário Celso Lisboa",
    description:
      "Papel timbrado padrão da Celso Lisboa (logo, barra e rodapé em todas as páginas) para atividades e trabalhos de faculdade.",
    background: capaCelsoLisboaBg,
    drawHeader: drawHeaderCelsoLisboa,
    defaultFields: {
      curso: "Engenharia de Computação",
      registroAcademico: "24113801",
      nome: "Thiago F. A. A. dos Santos",
    },
  },
  // Quando houver exemplo de outro template (TCC, Declaração, etc.),
  // uma nova entrada entra aqui, seguindo o mesmo formato acima.
};

export const DEFAULT_TEMPLATE_ID = "celso-lisboa";

// Devolve um template pelo id, ou o padrão se o id nao existir/nao vier.
export const getTemplate = (templateId) => PDF_TEMPLATES[templateId] || PDF_TEMPLATES[DEFAULT_TEMPLATE_ID];

// Lista resumida (id/name/description) para a IA escolher o template certo
// quando houver mais de um cadastrado.
export const listTemplates = () =>
  Object.values(PDF_TEMPLATES).map(({ id, name, description }) => ({ id, name, description }));
