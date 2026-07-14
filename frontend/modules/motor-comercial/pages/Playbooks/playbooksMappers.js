/**
 * Mapeadores da Central de Playbooks — Sprint O-10 / O-11.
 *
 * @module frontend/modules/motor-comercial/pages/Playbooks/playbooksMappers
 */

const { workflowIdFromPlaybook } = require('../WorkflowCenter/workflowMappers');

const STORAGE_PREFIX = 'motor-comercial:playbooks';

const KEYS = {
  instances: `${STORAGE_PREFIX}-instancias`,
  history: `${STORAGE_PREFIX}-historico`,
  favorites: `${STORAGE_PREFIX}-favoritos`
};

function readJson(key, fallback = {}) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
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

function getInstances() {
  return readJson(KEYS.instances, {});
}

function saveInstance(playbookId, data) {
  const instances = getInstances();
  instances[playbookId] = { ...instances[playbookId], ...data };
  writeJson(KEYS.instances, instances);
  return instances[playbookId];
}

function startPlaybook(playbook, extra = {}) {
  const instances = getInstances();
  const existing = instances[playbook.id];
  if (existing && existing.status === 'EM_ANDAMENTO') return existing;

  const instance = {
    playbookId: playbook.id,
    nome: playbook.nome,
    status: 'EM_ANDAMENTO',
    passoAtual: 0,
    inicio: new Date().toISOString(),
    fim: null,
    observacoes: extra.observacoes || '',
    clienteId: extra.clienteId || playbook.clienteId || null,
    checklist: (playbook.passos || []).map((p, i) => ({
      passoId: p.id,
      titulo: p.titulo,
      status: i === 0 ? 'EM_ANDAMENTO' : 'PENDENTE'
    }))
  };
  instances[playbook.id] = instance;
  writeJson(KEYS.instances, instances);
  appendHistory({
    playbookId: playbook.id,
    nome: playbook.nome,
    acao: 'INICIADO',
    usuario: getOperadorNome(),
    quando: instance.inicio
  });
  return instance;
}

function updateChecklistItem(playbookId, passoId, status) {
  const instances = getInstances();
  const inst = instances[playbookId];
  if (!inst) return null;

  inst.checklist = inst.checklist.map((item) =>
    item.passoId === passoId ? { ...item, status } : item
  );

  const idx = inst.checklist.findIndex((c) => c.passoId === passoId);
  if (status === 'CONCLUIDO' && idx >= 0 && idx < inst.checklist.length - 1) {
    inst.passoAtual = idx + 1;
    if (inst.checklist[idx + 1].status === 'PENDENTE') {
      inst.checklist[idx + 1].status = 'EM_ANDAMENTO';
    }
  }

  const allDone = inst.checklist.every((c) => ['CONCLUIDO', 'IGNORADO'].includes(c.status));
  if (allDone) {
    inst.status = 'CONCLUIDO';
    inst.fim = new Date().toISOString();
    appendHistory({
      playbookId,
      nome: inst.nome,
      acao: 'CONCLUIDO',
      usuario: getOperadorNome(),
      quando: inst.fim,
      resultado: 'Guia operacional concluído'
    });
  }

  instances[playbookId] = inst;
  writeJson(KEYS.instances, instances);
  return inst;
}

function appendHistory(entry) {
  const history = readJson(KEYS.history, []);
  history.unshift({ ...entry, id: `pb-hist-${Date.now()}` });
  writeJson(KEYS.history, history.slice(0, 200));
}

function loadHistory() {
  return readJson(KEYS.history, []);
}

function toggleFavorite(id) {
  const fav = readJson(KEYS.favorites, []);
  const idx = fav.indexOf(id);
  if (idx >= 0) fav.splice(idx, 1);
  else fav.push(id);
  writeJson(KEYS.favorites, fav);
  return fav.includes(id);
}

function isFavorite(id) {
  return readJson(KEYS.favorites, []).includes(id);
}

function mapPlaybook(pb, instance = null) {
  const inst = instance || getInstances()[pb.id];
  const checklist = inst?.checklist || pb.checklist || [];
  const concluidos = checklist.filter((c) => c.status === 'CONCLUIDO').length;
  const progresso = checklist.length ? Math.round((concluidos / checklist.length) * 100) : 0;
  const tempoPrevistoMinutos = pb.tempoEstimadoMinutos ?? null;
  let tempoRealizadoMinutos = null;
  if (inst?.inicio && inst?.fim) {
    tempoRealizadoMinutos = Math.round((new Date(inst.fim) - new Date(inst.inicio)) / 60000);
  } else if (inst?.inicio && inst?.status === 'EM_ANDAMENTO') {
    tempoRealizadoMinutos = Math.round((Date.now() - new Date(inst.inicio)) / 60000);
  }

  return {
    id: pb.id,
    codigo: pb.codigo,
    nome: pb.nome,
    descricao: pb.descricao,
    objetivo: pb.objetivo,
    categoria: pb.categoria,
    tempoEstimadoMinutos: pb.tempoEstimadoMinutos,
    tempoPrevistoMinutos,
    tempoRealizadoMinutos,
    percentualConcluido: progresso,
    resultadoEsperado: pb.resultadoEsperado,
    preRequisitos: pb.preRequisitos || [],
    passos: pb.passos || [],
    checklist,
    progresso,
    passoAtual: inst?.passoAtual ?? 0,
    status: inst?.status || (pb.aplicavel ? 'DISPONIVEL' : 'DISPONIVEL'),
    instanceStatus: inst?.status || null,
    score: pb.score ?? 0,
    aplicavel: pb.aplicavel !== false,
    recomendacoesRelacionadas: pb.recomendacoesRelacionadas || [],
    insightsRelacionados: pb.insightsRelacionados || [],
    kpisRelacionados: pb.kpisRelacionados || [],
    documentosRelacionados: pb.documentosRelacionados || [],
    clienteId: pb.clienteId || inst?.clienteId || null,
    favorito: isFavorite(pb.id),
    inicio: inst?.inicio || null,
    fim: inst?.fim || null,
    observacoes: inst?.observacoes || '',
    workflowId: workflowIdFromPlaybook(pb),
    raw: pb
  };
}

function buildViewFromPayload(payload = {}) {
  const instances = getInstances();
  const playbooks = (payload.playbooks || []).map((pb) => mapPlaybook(pb, instances[pb.id]));
  const sugeridos = (payload.sugeridos || []).map((pb) => mapPlaybook(pb, instances[pb.id]));
  const history = loadHistory();

  const emAndamento = playbooks.filter((p) => p.instanceStatus === 'EM_ANDAMENTO');
  const concluidos = playbooks.filter((p) => p.instanceStatus === 'CONCLUIDO');
  const iniciados = Object.keys(instances).length;

  const tempos = history
    .filter((h) => h.acao === 'CONCLUIDO')
    .map((h) => h.tempoMinutos)
    .filter((t) => t != null);

  const kpisApi = payload.kpis || {};
  const kpis = {
    catalogoTotal: kpisApi.catalogoTotal ?? playbooks.length,
    iniciados: iniciados || kpisApi.iniciados,
    concluidos: concluidos.length || kpisApi.concluidos,
    emAndamento: emAndamento.length,
    tempoMedioMinutos: tempos.length
      ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length)
      : kpisApi.tempoMedioMinutos,
    eficiencia: iniciados ? Math.round((concluidos.length / iniciados) * 100) : 0,
    taxaConclusao: iniciados ? Math.round((concluidos.length / iniciados) * 100) : kpisApi.taxaConclusao || 0
  };

  const categorias = {};
  playbooks.forEach((p) => {
    if (!categorias[p.categoria]) categorias[p.categoria] = [];
    categorias[p.categoria].push(p);
  });

  return {
    resumo: payload.resumo || { total: playbooks.length },
    playbooks,
    sugeridos,
    categorias,
    emAndamento,
    kpis,
    historico: history
  };
}

function buildFilterParams(filters = {}) {
  const params = {};
  if (filters.clienteId) params.clienteId = filters.clienteId;
  if (filters.consignacaoId) params.consignacaoId = filters.consignacaoId;
  return params;
}

function applyFilters(view, filters = {}) {
  let list = [...(view.playbooks || [])];
  if (filters.categoria) list = list.filter((p) => p.categoria === filters.categoria);
  if (filters.favoritos) list = list.filter((p) => p.favorito);
  if (filters.emAndamento) list = list.filter((p) => p.instanceStatus === 'EM_ANDAMENTO');
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((p) =>
      [p.nome, p.descricao, p.codigo, p.categoria]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }
  return { ...view, playbooks: list };
}

function categoriaLabel(c) {
  const map = {
    COBRANCA: 'Cobrança',
    RENEGOCIACAO: 'Renegociação',
    ENTREGA: 'Entrega',
    PRESTACAO: 'Fechamento',
    RECUPERACAO: 'Recuperação',
    VISITA_COMERCIAL: 'Visita Comercial',
    ATUALIZACAO_CADASTRAL: 'Atualização Cadastral',
    BLOQUEIO: 'Bloqueio',
    LIBERACAO: 'Liberação',
    CLIENTE_VIP: 'Cliente VIP'
  };
  return map[c] || c;
}

function statusChecklistVariant(s) {
  const map = {
    PENDENTE: 'default',
    EM_ANDAMENTO: 'info',
    CONCLUIDO: 'success',
    IGNORADO: 'default',
    BLOQUEADO: 'error'
  };
  return map[s] || 'default';
}

function findPlaybookByRecomendacao(view, recId) {
  return view.playbooks.find((p) => p.recomendacoesRelacionadas?.includes(recId))
    || view.sugeridos[0]
    || null;
}

module.exports = {
  KEYS,
  buildViewFromPayload,
  buildFilterParams,
  applyFilters,
  startPlaybook,
  updateChecklistItem,
  saveInstance,
  getInstances,
  loadHistory,
  toggleFavorite,
  categoriaLabel,
  statusChecklistVariant,
  findPlaybookByRecomendacao,
  mapPlaybook
};
