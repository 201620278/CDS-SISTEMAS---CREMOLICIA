/**
 * Mapeadores da Central de Pendências — transformação de campos da API.
 *
 * Sprint O-8: sem cálculos de negócio no Frontend.
 * Sprint O-11: vínculo com Workflow Center.
 *
 * @module frontend/modules/motor-comercial/pages/Pendencias/pendenciasMappers
 */

const { workflowIdFromPendencia } = require('../WorkflowCenter/workflowMappers');

const STORAGE_PREFIX = 'motor-comercial:pendencias';

const KEYS = {
  resolved: `${STORAGE_PREFIX}-resolvidas`,
  ignored: `${STORAGE_PREFIX}-ignoradas`,
  deferred: `${STORAGE_PREFIX}-adiadas`,
  delegated: `${STORAGE_PREFIX}-delegadas`,
  history: `${STORAGE_PREFIX}-historico`,
  favorites: `${STORAGE_PREFIX}-favoritos`,
  observations: `${STORAGE_PREFIX}-observacoes`
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

function getPendenciasState() {
  return {
    resolved: readJson(KEYS.resolved),
    ignored: readJson(KEYS.ignored),
    deferred: readJson(KEYS.deferred),
    delegated: readJson(KEYS.delegated),
    favorites: readJson(KEYS.favorites),
    observations: readJson(KEYS.observations, {})
  };
}

function savePendenciaAction(type, alerta, extra = {}) {
  const state = getPendenciasState();
  const id = alerta.id;

  if (type === 'resolved') {
    if (!state.resolved.includes(id)) state.resolved.push(id);
    appendHistory({
      alertaId: id,
      alerta: alerta.descricao || alerta.titulo,
      acao: 'RESOLVIDO',
      responsavel: extra.responsavel || getOperadorNome(),
      observacao: extra.observacao || '',
      resolvidoEm: new Date().toISOString(),
      tempoResolucaoHoras: extra.tempoResolucaoHoras ?? null
    });
  } else if (type === 'ignored') {
    if (!state.ignored.includes(id)) state.ignored.push(id);
  } else if (type === 'deferred') {
    state.deferred.push({ id, until: extra.until || null, em: new Date().toISOString() });
  } else if (type === 'delegated') {
    state.delegated.push({ id, para: extra.para, em: new Date().toISOString() });
  } else if (type === 'observation') {
    state.observations[id] = extra.observacao || '';
  }

  writeJson(KEYS.resolved, state.resolved);
  writeJson(KEYS.ignored, state.ignored);
  writeJson(KEYS.deferred, state.deferred);
  writeJson(KEYS.delegated, state.delegated);
  writeJson(KEYS.observations, state.observations);
}

function appendHistory(entry) {
  const history = readJson(KEYS.history);
  history.unshift({ ...entry, id: `hist-${Date.now()}` });
  writeJson(KEYS.history, history.slice(0, 200));
}

function loadHistory() {
  return readJson(KEYS.history);
}

function toggleFavorite(id) {
  const favorites = readJson(KEYS.favorites);
  const idx = favorites.indexOf(id);
  if (idx >= 0) favorites.splice(idx, 1);
  else favorites.push(id);
  writeJson(KEYS.favorites, favorites);
  return favorites.includes(id);
}

function isFavorite(id) {
  return readJson(KEYS.favorites).includes(id);
}

function getOperadorNome() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.nome || user?.username || 'Operador';
  } catch {
    return 'Operador';
  }
}

function mapAlertItem(item) {
  const workflowId = workflowIdFromPendencia(item);
  return {
    id: item.id,
    categoria: item.categoria || 'COMERCIAL',
    severidade: item.severidade || 'INFO',
    prioridade: item.prioridade || 'NORMAL',
    cliente: item.cliente || null,
    clienteId: item.clienteId || null,
    consignacaoId: item.consignacaoId || null,
    documento: item.documento || null,
    descricao: item.descricao || item.titulo || item.mensagem || '',
    motivo: item.motivo || item.mensagem || '',
    impacto: item.impacto || '',
    acaoRecomendada: item.acaoRecomendada || item.acao || '',
    data: item.data || null,
    responsavel: item.responsavel || null,
    status: item.status || 'PENDENTE',
    origemProjecao: item.origemProjecao || '',
    origemInsight: item.origemInsight || '',
    link: item.link || '',
    tipo: item.tipo || item.codigo || '',
    workflowId,
    workflowRelacionado: workflowId,
    raw: item
  };
}

function applyLocalState(alertas = []) {
  const state = getPendenciasState();
  const now = Date.now();

  return alertas
    .map(mapAlertItem)
    .filter((a) => !state.ignored.includes(a.id))
    .filter((a) => !state.resolved.includes(a.id))
    .filter((a) => {
      const defer = state.deferred.find((d) => d.id === a.id);
      if (!defer || !defer.until) return true;
      return new Date(defer.until).getTime() <= now;
    })
    .map((a) => ({
      ...a,
      favorito: isFavorite(a.id),
      observacao: state.observations[a.id] || '',
      delegado: state.delegated.find((d) => d.id === a.id) || null
    }));
}

function buildViewFromPayload(payload = {}) {
  const alertas = applyLocalState(payload.alertas || []);
  const state = getPendenciasState();
  const resolvedToday = readJson(KEYS.history).filter((h) => {
    if (h.acao !== 'RESOLVIDO' || !h.resolvidoEm) return false;
    const d = new Date(h.resolvidoEm);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const resumo = {
    ...(payload.resumo || {}),
    resolvidosHoje: resolvedToday,
    pendentes: alertas.length
  };

  const filterByIds = (list, ids) => list.filter((a) => ids.includes(a.id));

  const criticaIds = (payload.criticas || []).map((a) => a.id);
  const importanteIds = (payload.importantes || []).map((a) => a.id);
  const informativaIds = (payload.informativas || []).map((a) => a.id);

  return {
    resumo,
    criticas: filterByIds(alertas, criticaIds),
    importantes: filterByIds(alertas, importanteIds),
    informativas: filterByIds(alertas, informativaIds),
    alertas,
    proximasAcoes: (payload.proximasAcoes || [])
      .filter((a) => alertas.some((x) => x.id === a.id)),
    categorias: payload.categorias || {},
    historico: loadHistory(),
    notificationCount: alertas.filter((a) =>
      ['CRITICAL', 'HIGH'].includes(String(a.severidade).toUpperCase())
    ).length
  };
}

function buildFilterParams(filters = {}) {
  const params = {};
  if (filters.clienteId) params.clienteId = filters.clienteId;
  if (filters.consignacaoId) params.consignacaoId = filters.consignacaoId;
  if (filters.dataInicio) params.dataInicio = filters.dataInicio;
  if (filters.dataFim) params.dataFim = filters.dataFim;
  if (filters.operadorId) params.usuarioId = filters.operadorId;
  return params;
}

function applyFilters(view, filters = {}) {
  let list = [...(view.alertas || [])];

  if (filters.categoria) {
    list = list.filter((a) => a.categoria === filters.categoria);
  }
  if (filters.severidade) {
    list = list.filter((a) => String(a.severidade).toUpperCase() === filters.severidade.toUpperCase());
  }
  if (filters.clienteId) {
    list = list.filter((a) => String(a.clienteId) === String(filters.clienteId));
  }
  if (filters.status) {
    list = list.filter((a) => a.status === filters.status);
  }
  if (filters.favoritos) {
    list = list.filter((a) => a.favorito);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((a) =>
      [a.descricao, a.motivo, a.cliente, a.documento, a.tipo, a.categoria]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }

  const criticaIds = new Set(view.criticas.map((a) => a.id));
  const importanteIds = new Set(view.importantes.map((a) => a.id));

  return {
    ...view,
    alertas: list,
    criticas: list.filter((a) => criticaIds.has(a.id)),
    importantes: list.filter((a) => importanteIds.has(a.id)),
    informativas: list.filter((a) => !criticaIds.has(a.id) && !importanteIds.has(a.id))
  };
}

function severityVariant(sev) {
  const s = String(sev).toUpperCase();
  if (s === 'CRITICAL') return 'error';
  if (s === 'HIGH' || s === 'WARN' || s === 'WARNING') return 'warning';
  if (s === 'MEDIUM') return 'info';
  return 'default';
}

function countPendenciasForConsignacao(alertas, consignacaoId) {
  return alertas.filter((a) => String(a.consignacaoId) === String(consignacaoId)).length;
}

function countPendenciasForCliente(alertas, clienteId) {
  return alertas.filter((a) => String(a.clienteId) === String(clienteId)).length;
}

module.exports = {
  KEYS,
  getPendenciasState,
  savePendenciaAction,
  loadHistory,
  toggleFavorite,
  isFavorite,
  buildViewFromPayload,
  buildFilterParams,
  applyFilters,
  applyLocalState,
  severityVariant,
  countPendenciasForConsignacao,
  countPendenciasForCliente,
  mapAlertItem
};
