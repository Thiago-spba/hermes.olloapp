import { useState, useEffect, useRef, useMemo } from "react";
import {
  getNotas,
  saveNota,
  deleteNota,
  toggleFixarNota,
  salvarVersao,
  getVersoes,
} from "../services/notasService";

// Gera uma cor consistente para cada tag baseada no nome (hash simples)
const TAG_PALETTE = ["#4f9cf9", "#f97d4f", "#a35bf9", "#3ecf8e", "#f9c74f", "#f94f6d", "#4ff9d8", "#9c9cf9"];
const getTagColor = (tag) => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) % TAG_PALETTE.length;
  return TAG_PALETTE[Math.abs(hash)];
};

const NotebookPanel = ({ isDark, onClose, userId }) => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroTag, setFiltroTag] = useState(null);
  const [showVersoes, setShowVersoes] = useState(false);
  const [versoes, setVersoes] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [novaTagInput, setNovaTagInput] = useState("");

  const saveTimer = useRef(null);
  const lastSavedContent = useRef("");

  const c = {
    bg: isDark ? "#071a14" : "#f0faf7",
    card: isDark ? "#0d2e1f" : "#ffffff",
    border: isDark ? "#143d2e" : "#b0ddd4",
    text: isDark ? "#e0f5f0" : "#071a14",
    sub: isDark ? "#7aada0" : "#2a6b5a",
    input: isDark ? "#0a2218" : "#f5faf8",
  };

  const carregarNotas = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const list = await getNotas(userId);
      setNotas(list);
    } catch (err) {
      console.error("[NOTAS] Erro ao carregar:", err.message || err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarNotas();
  }, [userId]);

  const tagsExistentes = useMemo(() => {
    const set = new Set();
    notas.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notas]);

  const notasFiltradas = useMemo(() => {
    let list = [...notas];
    if (filtroTag) {
      list = list.filter((n) => (n.tags || []).includes(filtroTag));
    }
    if (busca.trim()) {
      const termo = busca.toLowerCase();
      list = list.filter(
        (n) =>
          (n.titulo || "").toLowerCase().includes(termo) ||
          (n.conteudo || "").toLowerCase().includes(termo),
      );
    }
    list.sort((a, b) => {
      if (!!a.fixada !== !!b.fixada) return a.fixada ? -1 : 1;
      return 0;
    });
    return list;
  }, [notas, busca, filtroTag]);

  const criarNota = async () => {
    const nova = { titulo: "Nova nota", conteudo: "", tags: [], fixada: false };
    const id = await saveNota(userId, nova);
    const notaCompleta = { ...nova, id };
    setNotas((prev) => [notaCompleta, ...prev]);
    setSelecionada(notaCompleta);
    lastSavedContent.current = "";
  };

  const abrirNota = (nota) => {
    setSelecionada(nota);
    lastSavedContent.current = nota.conteudo || "";
    setShowVersoes(false);
  };

  const agendarSalvamento = (campo, valor) => {
    const atualizada = { ...selecionada, [campo]: valor };
    setSelecionada(atualizada);

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSalvando(true);
      try {
        if (
          campo === "conteudo" &&
          lastSavedContent.current &&
          lastSavedContent.current !== valor
        ) {
          await salvarVersao(
            userId,
            atualizada.id,
            lastSavedContent.current,
            atualizada.titulo,
          );
        }
        await saveNota(userId, atualizada);
        if (campo === "conteudo") lastSavedContent.current = valor;
        setNotas((prev) =>
          prev.map((n) => (n.id === atualizada.id ? atualizada : n)),
        );
      } catch (err) {
        console.error("[NOTAS] Erro ao salvar:", err.message || err);
      } finally {
        setSalvando(false);
      }
    }, 1200);
  };

  const excluirNota = async (nota) => {
    if (!window.confirm(`Excluir a nota "${nota.titulo}"?`)) return;
    await deleteNota(userId, nota.id);
    if (selecionada?.id === nota.id) setSelecionada(null);
    await carregarNotas();
  };

  const alternarFixar = async (nota) => {
    await toggleFixarNota(userId, nota.id, !nota.fixada);
    await carregarNotas();
    if (selecionada?.id === nota.id) {
      setSelecionada({ ...selecionada, fixada: !nota.fixada });
    }
  };

  const adicionarTag = async () => {
    const tag = novaTagInput.trim();
    if (!tag) return;
    const tagsAtuais = selecionada.tags || [];
    if (tagsAtuais.includes(tag)) {
      setNovaTagInput("");
      return;
    }
    const novasTags = [...tagsAtuais, tag];
    const atualizada = { ...selecionada, tags: novasTags };
    setSelecionada(atualizada);
    setNotas((prev) => prev.map((n) => (n.id === atualizada.id ? atualizada : n)));
    setNovaTagInput("");
    await saveNota(userId, atualizada);
  };

  const removerTag = async (tag) => {
    const novasTags = (selecionada.tags || []).filter((t) => t !== tag);
    const atualizada = { ...selecionada, tags: novasTags };
    setSelecionada(atualizada);
    setNotas((prev) => prev.map((n) => (n.id === atualizada.id ? atualizada : n)));
    await saveNota(userId, atualizada);
  };

  const copiarConteudo = () => {
    navigator.clipboard.writeText(selecionada?.conteudo || "");
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  const abrirHistorico = async () => {
    const list = await getVersoes(userId, selecionada.id);
    setVersoes(list);
    setShowVersoes(true);
  };

  const restaurarVersao = async (versao) => {
    if (
      !window.confirm(
        "Restaurar esta versão? O conteúdo atual será substituído.",
      )
    )
      return;
    await salvarVersao(
      userId,
      selecionada.id,
      selecionada.conteudo,
      selecionada.titulo,
    );
    const atualizada = {
      ...selecionada,
      conteudo: versao.conteudo,
      titulo: versao.titulo,
    };
    setSelecionada(atualizada);
    lastSavedContent.current = versao.conteudo;
    await saveNota(userId, atualizada);
    await carregarNotas();
    setShowVersoes(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: c.bg,
          color: c.text,
          width: "95%",
          maxWidth: 900,
          height: "85vh",
          borderRadius: 12,
          display: "flex",
          overflow: "hidden",
          border: `1px solid ${c.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* LISTA DE NOTAS */}
        <div
          style={{
            width: 280,
            borderRight: `1px solid ${c.border}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: 12, borderBottom: `1px solid ${c.border}` }}>
            <button
              onClick={criarNota}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: 8,
                border: "none",
                background: "#3ecf8e",
                color: "#072",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: 8,
              }}
            >
              📓 Nova nota
            </button>
            <input
              placeholder="🔎 Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 6,
                border: `1px solid ${c.border}`,
                background: c.input,
                color: c.text,
              }}
            />
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginTop: 8,
              }}
            >
              {tagsExistentes.map((tag) => (
                <span
                  key={tag}
                  onClick={() => setFiltroTag(filtroTag === tag ? null : tag)}
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: getTagColor(tag),
                    color: "#fff",
                    opacity: filtroTag && filtroTag !== tag ? 0.35 : 1,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {loading && (
              <p style={{ padding: 12, color: c.sub }}>Carregando...</p>
            )}
            {!loading && notasFiltradas.length === 0 && (
              <p style={{ padding: 12, color: c.sub }}>
                Nenhuma nota encontrada.
              </p>
            )}
            {notasFiltradas.map((nota) => (
              <div
                key={nota.id}
                onClick={() => abrirNota(nota)}
                style={{
                  padding: 10,
                  borderBottom: `1px solid ${c.border}`,
                  cursor: "pointer",
                  background:
                    selecionada?.id === nota.id ? c.card : "transparent",
                }}
              >
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <strong style={{ fontSize: 14 }}>
                    {nota.fixada ? "📌 " : ""}
                    {nota.titulo || "Sem título"}
                  </strong>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alternarFixar(nota);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    title={nota.fixada ? "Desfixar" : "Fixar"}
                  >
                    {nota.fixada ? "📌" : "📍"}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: c.sub, margin: "4px 0 0" }}>
                  {(nota.conteudo || "").slice(0, 60)}
                </p>
                <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                  {(nota.tags || []).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 10,
                        padding: "1px 6px",
                        borderRadius: 8,
                        background: getTagColor(tag),
                        color: "#fff",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EDITOR */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {!selecionada ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.sub,
              }}
            >
              Selecione ou crie uma nota.
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: 12,
                  borderBottom: `1px solid ${c.border}`,
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <input
                  value={selecionada.titulo}
                  onChange={(e) => agendarSalvamento("titulo", e.target.value)}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    fontWeight: 600,
                    padding: 6,
                    borderRadius: 6,
                    border: `1px solid ${c.border}`,
                    background: c.input,
                    color: c.text,
                  }}
                />
                <button
                  onClick={copiarConteudo}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: `1px solid ${c.border}`,
                    background: c.card,
                    color: c.text,
                    cursor: "pointer",
                  }}
                >
                  {copiado ? "✅ Copiado" : "📋 Copiar"}
                </button>
                <button
                  onClick={abrirHistorico}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: `1px solid ${c.border}`,
                    background: c.card,
                    color: c.text,
                    cursor: "pointer",
                  }}
                >
                  🕒 Histórico
                </button>
                <button
                  onClick={() => excluirNota(selecionada)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: `1px solid ${c.border}`,
                    background: "#a33",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                >
                  🗑️
                </button>
              </div>

              <div style={{ padding: "6px 12px", display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                {(selecionada.tags || []).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 10,
                      background: getTagColor(tag),
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {tag}
                    <span onClick={() => removerTag(tag)} style={{ cursor: "pointer", fontWeight: 700 }}>×</span>
                  </span>
                ))}
                <input
                  value={novaTagInput}
                  onChange={(e) => setNovaTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") adicionarTag(); }}
                  placeholder="+ tag"
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 10,
                    border: `1px solid ${c.border}`,
                    background: c.input,
                    color: c.text,
                    width: 70,
                  }}
                />
                <span style={{ marginLeft: "auto", fontSize: 12, color: c.sub }}>
                  {salvando ? "Salvando..." : "Salvo ✓"}
                </span>
              </div>

              <textarea
                value={selecionada.conteudo}
                onChange={(e) => agendarSalvamento("conteudo", e.target.value)}
                style={{
                  flex: 1,
                  margin: 12,
                  padding: 10,
                  borderRadius: 8,
                  border: `1px solid ${c.border}`,
                  background: c.input,
                  color: c.text,
                  resize: "none",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              />
            </>
          )}
        </div>

        {/* HISTÓRICO DE VERSÕES */}
        {showVersoes && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 300,
              background: c.card,
              borderLeft: `1px solid ${c.border}`,
              padding: 12,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <strong>🕒 Versões antigas</strong>
              <button
                onClick={() => setShowVersoes(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.text,
                }}
              >
                ✕
              </button>
            </div>
            {versoes.length === 0 && (
              <p style={{ color: c.sub, fontSize: 13 }}>
                Nenhuma versão anterior ainda.
              </p>
            )}
            {versoes.map((v) => (
              <div
                key={v.id}
                style={{
                  borderBottom: `1px solid ${c.border}`,
                  padding: "8px 0",
                }}
              >
                <p style={{ fontSize: 12, color: c.sub, margin: 0 }}>
                  {v.criadoEm?.toDate
                    ? v.criadoEm.toDate().toLocaleString("pt-BR")
                    : "..."}
                </p>
                <p style={{ fontSize: 13, margin: "4px 0" }}>
                  {(v.conteudo || "").slice(0, 80)}...
                </p>
                <button
                  onClick={() => restaurarVersao(v)}
                  style={{
                    fontSize: 12,
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: `1px solid ${c.border}`,
                    background: "transparent",
                    color: c.text,
                    cursor: "pointer",
                  }}
                >
                  Restaurar esta versão
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "none",
            border: "none",
            fontSize: 20,
            color: c.text,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default NotebookPanel;
