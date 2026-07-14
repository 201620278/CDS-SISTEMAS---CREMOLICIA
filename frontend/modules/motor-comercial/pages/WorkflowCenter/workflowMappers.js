/**
 * Mapeadores da Central de Workflow — Sprint O-11.
 *
 * @module frontend/modules/motor-comercial/pages/WorkflowCenter/workflowMappers
 */

const STORAGE_PREFIX = 'motor-comercial:workflow';

const KEYS = {
  status: `${STORAGE_PREFIX}-status`,
  responsavel: `${STORAGE_PREFIX}-responsavel`,
  history: `${STORAGE_PREFIX}-historico`,
  concluidos: `${STORAGE_PREFIX}-concluidos`
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

function buildWorkflowId(origem, origemId, clienteId, consignacaoId) {
  const base = [
    String(origem || 'WF'),
    String(origemId || '0'),
    String(clienteId || '0'),
    String(consignacaoId || '0')
  ].join('-');
  return `WF-${base.replace(/[^a-zA-Z0-9-_]/g, '')}`;
}

function workflowIdFromItem(item) {
  if (item.id) return item.id;
  return buildWorkflowId(item.origemTipo, item.origemId, item.clienteId, item.consignacaoId);
}

function workflowIdFromPendencia(alerta) {
  return buildWorkflowId('PEND', alerta.id, alerta.clienteId, alerta.consignacaoId);
}

function workflowIdFromPlaybook(pb) {
  return buildWorkflowId('PB', pb.id, pb.clienteId, null);
}

function applyLocalState(workflows = []) {
  const statusMap = readJson(KEYS.status, {});
  const respMap = readJson(KEYS.responsavel, {});
  const concluidos = readJson(KEYS.concluidos, []);

  return workflows.map((wf) => {
    const id = wf.id;
    let coluna = statusMap[id]?.coluna || wf.coluna || 'novo';
    let statusOperacional = statusMap[id]?.statusOperacional || wf.statusOperacional || 'NOVO';

    if (concluidos.includes(id)) {
      coluna = 'concluido';
      statusOperacional = 'CONCLUIDO';
    }

    return {
      ...wf,
      coluna,
      statusOperacional,
      responsavel: respMap[id] || wf.responsavel || 'Não atribuído',
      concluido: coluna === 'concluido'
    };
  });
}

function rebuildKanban(workflows) {
  const kanban = {
    novo: [],
    emAndamento: [],
    aguardando: [],
    bloqueado: [],
    concluido: []
  };
  workflows.forEach((wf) => {
    const key = wf.coluna || 'novo';
    if (kanban[key]) kanban[key].push(wf);
    else kanban.novo.push(wf);
  });
  return kanban;
}

function buildViewFromPayload(payload = {}) {
  const workflows = applyLocalState(payload.workflows || []);
  const kanban = rebuildKanban(workflows);
  const fila = [...workflows].sort((a, b) => {
    const pri = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
    return (pri[b.prioridade] || 0) - (pri[a.prioridade] || 0);
  });

  const ativos = workflows.filter((w) => w.coluna !== 'concluido');
  const concluidos = workflows.filter((w) => w.coluna === 'concluido');
  const emAtraso = workflows.filter((w) => w.sla?.status === 'VENCIDO').length;
  const concluidosHoje = readJson(KEYS.history, [])
    .filter((h) => h.acao === 'CONCLUIDO' && h.quando && new Date(h.quando).toDateString() === new Date().toDateString())
    .length;

  const resumo = {
    ...(payload.resumo || {}),
    workflowsAtivos: ativos.length,
    concluidosHoje: concluidosHoje || payload.resumo?.concluidosHoje || concluidos.length,
    bloqueados: kanban.bloqueado.length,
    emAtraso,
    slaVencido: emAtraso
  };

  return {
    resumo,
    fila,
    workflows,
    kanban,
    sla: payload.sla || {},
    distribuicao: payload.distribuicao || [],
    timeline: payload.timeline || [],
    historico: loadHistory()
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
  let list = [...(view.workflows || [])];

  if (filters.operador) {
    list = list.filter((w) => String(w.responsavel).toLowerCase().includes(filters.operador.toLowerCase()));
  }
  if (filters.clienteId) {
    list = list.filter((w) => String(w.clienteId) === String(filters.clienteId));
  }
  if (filters.categoria) {
    list = list.filter((w) => w.categoria === filters.categoria);
  }
  if (filters.prioridade) {
    list = list.filter((w) => w.prioridade === filters.prioridade);
  }
  if (filters.status) {
    list = list.filter((w) => w.coluna === filters.status || w.statusOperacional === filters.status);
  }
  if (filters.sla) {
    list = list.filter((w) => w.sla?.status === filters.sla || w.sla?.indicador === filters.sla);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter((w) =>
      [w.titulo, w.cliente, w.documento, w.playbook, w.responsavel, w.tipo]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }

  const kanban = rebuildKanban(list);
  return {
    ...view,
    workflows: list,
    fila: list,
    kanban
  };
}

function updateWorkflowStatus(workflowId, coluna, statusOperacional) {
  const statusMap = readJson(KEYS.status, {});
  statusMap[workflowId] = { coluna, statusOperacional, atualizadoEm: new Date().toISOString() };
  writeJson(KEYS.status, statusMap);

  if (coluna === 'concluido') {
    const concluidos = readJson(KEYS.concluidos, []);
    if (!concluidos.includes(workflowId)) concluidos.push(workflowId);
    writeJson(KEYS.concluidos, concluidos);
    appendHistory({
      workflowId,
      acao: 'CONCLUIDO',
      usuario: getOperadorNome(),
      quando: new Date().toISOString()
    });
  }
  return statusMap[workflowId];
}

function assignResponsavel(workflowId, responsavel) {
  const respMap = readJson(KEYS.responsavel, {});
  respMap[workflowId] = responsavel || getOperadorNome();
  writeJson(KEYS.responsavel, respMap);
  appendHistory({
    workflowId,
    acao: 'ATRIBUIDO',
    responsavel: respMap[workflowId],
    usuario: getOperadorNome(),
    quando: new Date().toISOString()
  });
  return respMap[workflowId];
}

function appendHistory(entry) {
  const history = readJson(KEYS.history, []);
  history.unshift({ ...entry, id: `wf-hist-${Date.now()}` });
  writeJson(KEYS.history, history.slice(0, 200));
}

function loadHistory() {
  return readJson(KEYS.history, []);
}

function slaVariant(indicador) {
  if (indicador === 'vermelho') return 'error';
  if (indicador === 'amarelo') return 'warning';
  return 'success';
}

function colunaLabel(coluna) {
  const map = {
    novo: 'Novo',
    emAndamento: 'Em andamento',
    aguardando: 'Aguardando',
    bloqueado: 'Bloqueado',
    concluido: 'Concluído'
  };
  return map[coluna] || coluna;
}

function formatTempo(minutos) {
  if (minutos == null || minutos === '') return '—';
  const m = Number(minutos);
  if (Number.isNaN(m)) return String(minutos);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h}h ${r}min` : `${h}h`;
}

function exportRows(view) {
  return (view.workflows || []).map((w) => ({
    Cliente: w.cliente,
    Documento: w.documento || '',
    Processo: w.titulo,
    'Guia operacional': w.playbook || '',
    Responsavel: w.responsavel,
    Prioridade: w.prioridade,
    Status: colunaLabel(w.coluna),
    SLA: w.sla?.status || '',
    Prazo: w.sla?.prazo ? new Date(w.sla.prazo).toLocaleString('pt-BR') : '',
    Tempo: formatTempo(w.tempoDecorridoMinutos)
  }));
}

function downloadCsv(rows, filename = 'workflow.csv') {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(';'),
    ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(';'))
  ];
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadExcelPlaceholder(rows) {
  if (!rows.length) return;
  const { exportToXlsx } = require('../../utils/exportacao');
  const headers = Object.keys(rows[0]);
  exportToXlsx(headers, rows.map((r) => headers.map((h) => r[h])), 'workflow.xlsx');
}

module.exports = {
  KEYS,
  buildWorkflowId,
  workflowIdFromItem,
  workflowIdFromPendencia,
  workflowIdFromPlaybook,
  buildViewFromPayload,
  buildFilterParams,
  applyFilters,
  updateWorkflowStatus,
  assignResponsavel,
  loadHistory,
  slaVariant,
  colunaLabel,
  formatTempo,
  exportRows,
  downloadCsv,
  downloadExcelPlaceholder
};
