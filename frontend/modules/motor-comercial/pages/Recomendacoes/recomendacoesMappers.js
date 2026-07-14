/**
 * Mapeadores da Central de Recomendações — transformação de campos da API.
 *
 * Sprint O-9: sem cálculos de negócio no Frontend.
 *
 * @module frontend/modules/motor-comercial/pages/Recomendacoes/recomendacoesMappers
 */

const STORAGE_PREFIX = 'motor-comercial:recomendacoes';

const KEYS = {
  viewed: `${STORAGE_PREFIX}-visualizadas`,
  accepted: `${STORAGE_PREFIX}-aceitas`,
  ignored: `${STORAGE_PREFIX}-ignoradas`,
  deferred: `${STORAGE_PREFIX}-adiadas`,
  completed: `${STORAGE_PREFIX}-concluidas`,
  history: `${STORAGE_PREFIX}-historico`,
  favorites: `${STORAGE_PREFIX}-favoritos`
};

function readJson(key, fallback = []) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getOperadorNome() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.nome || user?.username || 'Operador';
  } catch {
    return 'Operador';
  }
}

function getLocalStatus(id) {
  if (readJson(KEYS.completed).includes(id)) return 'CONCLUIDA';
  if (readJson(KEYS.accepted).includes(id)) return 'ACEITA';
  if (readJson(KEYS.ignored).includes(id)) return 'IGNORADA';
  const defer = readJson(KEYS.deferred).find((d) => d.id === id);
  if (defer && defer.until && new Date(defer.until).getTime() > Date.now()) return 'ADIADA';
  if (readJson(KEYS.viewed).includes(id)) return 'VISUALIZADA';
  return 'NOVA';
}

function mapRecomendacao(item) {
  const status = getLocalStatus(item.id);
  return {
    id: item.id,
    titulo: item.titulo || '',
    descricao: item.descricao || '',
    categoria: item.categoria || 'COMERCIAL',
    prioridade: item.prioridade || 'NORMAL',
    confianca: item.confianca ?? 0,
    impactoEstimado: item.impactoEstimado || item.impacto || '',
    motivo: item.motivo || '',
    origem: item.origem || '',
    insightRelacionado: item.insightRelacionado || null,
    projectionRelacionada: item.projectionRelacionada || '',
    clienteId: item.clienteId || null,
    cliente: item.cliente || null,
    consignacaoId: item.consignacaoId || null,
    documento: item.documento || null,
    data: item.data || null,
    status,
    tipo: item.tipo || '',
    link: item.link || '',
    pendenciaRelacionada: item.pendenciaRelacionada || null,
    favorito: readJson(KEYS.favorites).includes(item.id),
    raw: item
  };
}

function appendHistory(entry) {
  const history = readJson(KEYS.history);
  history.unshift({ ...entry, id: `rec-hist-${Date.now()}` });
  writeJson(KEYS.history, history.slice(0, 200));
}

function saveRecomendacaoAction(type, rec, extra = {}) {
  const id = rec.id;

  if (type === 'viewed') {
    const viewed = readJson(KEYS.viewed);
    if (!viewed.includes(id)) viewed.push(id);
    writeJson(KEYS.viewed, viewed);
  } else if (type === 'accepted') {
    const accepted = readJson(KEYS.accepted);
    if (!accepted.includes(id)) accepted.push(id);
    writeJson(KEYS.accepted, accepted);
    appendHistory({
      recomendacaoId: id,
      titulo: rec.titulo,
      acao: 'ACEITA',
      responsavel: extra.responsavel || getOperadorNome(),
      quando: new Date().toISOString(),
      resultado: extra.resultado || 'Aceita pelo operador'
    });
  } else if (type === 'ignored') {
    const ignored = readJson(KEYS.ignored);
    if (!ignored.includes(id)) ignored.push(id);
    writeJson(KEYS.ignored, ignored);
    appendHistory({
      recomendacaoId: id,
      titulo: rec.titulo,
      acao: 'IGNORADA',
      responsavel: extra.responsavel || getOperadorNome(),
      quando: new Date().toISOString(),
      resultado: extra.resultado || 'Ignorada pelo operador'
    });
  } else if (type === 'deferred') {
    const deferred = readJson(KEYS.deferred);
    deferred.push({ id, until: extra.until, em: new Date().toISOString() });
    writeJson(KEYS.deferred, deferred);
  } else if (type === 'completed') {
    const completed = readJson(KEYS.completed);
    if (!completed.includes(id)) completed.push(id);
    writeJson(KEYS.completed, completed);
    appendHistory({
      recomendacaoId: id,
      titulo: rec.titulo,
      acao: 'CONCLUIDA',
      responsavel: extra.responsavel || getOperadorNome(),
      quando: new Date().toISOString(),
      tempoHoras: extra.tempoHoras ?? null,
      resultado: extra.resultado || 'Concluída pelo operador'
    });
  }
}

function toggleFavorite(id) {
  const favorites = readJson(KEYS.favorites);
  const idx = favorites.indexOf(id);
  if (idx >= 0) favorites.splice(idx, 1);
  else favorites.push(id);
  writeJson(KEYS.favorites, favorites);
  return favorites.includes(id);
}

function loadHistory() {
  return readJson(KEYS.history);
}

function buildViewFromPayload(payload = {}) {
  const recomendacoes = (payload.recomendacoes || []).map(mapRecomendacao);
  const history = loadHistory();

  const kpisApi = payload.kpis || {};
  const aceitas = recomendacoes.filter((r) => r.status === 'ACEITA' || r.status === 'CONCLUIDA').length;
  const ignoradas = recomendacoes.filter((r) => r.status === 'IGNORADA').length;
  const concluidas = recomendacoes.filter((r) => r.status === 'CONCLUIDA').length;
  const emitidas = recomendacoes.length;
  const taxaAceitacao = emitidas ? Math.round((aceitas / emitidas) * 100) : 0;

  const kpis = {
    emitidas: kpisApi.emitidas ?? emitidas,
    aceitas: aceitas || kpisApi.aceitas,
    ignoradas: ignoradas || kpisApi.ignoradas,
    concluidas: concluidas || kpisApi.concluidas,
    taxaAceitacao: taxaAceitacao || kpisApi.taxaAceitacao,
    impactoEstimadoTotal: kpisApi.impactoEstimadoTotal ?? 0
  };

  const categorias = payload.categorias || {};
  const categoriasLocal = {
    CREDITO: [],
    COMERCIAL: [],
    FINANCEIRO: [],
    OPERACIONAL: [],
    ESTRATEGICO: []
  };
  recomendacoes.forEach((r) => {
    const cat = r.categoria || 'COMERCIAL';
    if (categoriasLocal[cat]) categoriasLocal[cat].push(r);
  });

  const ativas = recomendacoes.filter((r) => !['IGNORADA', 'CONCLUIDA', 'ADIADA'].includes(r.status));

  return {
    resumo: payload.resumo || { total: emitidas },
    recomendacoes: ativas,
    prioritarias: (payload.prioritarias || [])
      .map((p) => ativas.find((a) => a.id === p.id) || mapRecomendacao(p))
      .filter(Boolean),
    categorias: categoriasLocal,
    kpis,
    historico: history
  };
}

function buildFilterParams(filters = {}) {
  const params = {};
  if (filters.clienteId) params.clienteId = filters.clienteId;
  if (filters.consignacaoId) params.consignacaoId = filters.consignacaoId;
  if (filters.dataInicio) params.dataInicio = filters.dataInicio;
  if (filters.dataFim) params.dataFim = filters.dataFim;
  return params;
}

function applyFilters(view, filters = {}) {
  let list = [...(view.recomendacoes || [])];

  if (filters.categoria) list = list.filter((r) => r.categoria === filters.categoria);
  if (filters.prioridade) list = list.filter((r) => r.prioridade === filters.prioridade);
  if (filters.status) list = list.filter((r) => r.status === filters.status);
  if (filters.clienteId) list = list.filter((r) => String(r.clienteId) === String(filters.clienteId));
  if (filters.favoritos) list = list.filter((r) => r.favorito);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((r) =>
      [r.titulo, r.descricao, r.motivo, r.categoria, r.cliente]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }

  return { ...view, recomendacoes: list };
}

function priorityVariant(p) {
  const map = { URGENT: 'error', HIGH: 'warning', NORMAL: 'info', LOW: 'default' };
  return map[String(p).toUpperCase()] || 'default';
}

function categoriaLabel(c) {
  const map = {
    CREDITO: 'Crédito',
    COMERCIAL: 'Comercial',
    FINANCEIRO: 'Financeiro',
    OPERACIONAL: 'Operacional',
    ESTRATEGICO: 'Estratégico'
  };
  return map[c] || c;
}

module.exports = {
  KEYS,
  buildViewFromPayload,
  buildFilterParams,
  applyFilters,
  saveRecomendacaoAction,
  toggleFavorite,
  loadHistory,
  priorityVariant,
  categoriaLabel,
  mapRecomendacao
};
