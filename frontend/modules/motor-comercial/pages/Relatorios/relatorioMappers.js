/**
 * Mapeadores da Central de Inteligência Analítica — apenas campos da API.
 *
 * Sprint O-7: sem cálculos de negócio no Frontend.
 *
 * @module frontend/modules/motor-comercial/pages/Relatorios/relatorioMappers
 */

const {
  buildExecutiveCards,
  buildInsights,
  buildIndicators,
  buildGraphSeries,
  buildRankings,
  buildAlerts,
  buildFilterParams,
  classifyInsightPriority
} = require('../Dashboard/dashboardMappers');

const FAVORITES_KEY = 'motor-comercial:relatorios-favoritos';
const HISTORY_KEY = 'motor-comercial:relatorios-historico';
const LAYOUTS_KEY = 'motor-comercial:relatorios-layouts';

const PROJECTION_LABELS = {
  dashboard: 'Painel e indicadores',
  indicadores: 'Indicadores comerciais',
  insights: 'Análises comerciais',
  timeline: 'Linha do tempo',
  historico: 'Histórico comercial',
  saldos: 'Saldos e limites',
  contaCorrente: 'Conta corrente',
  situacaoCliente: 'Situação do cliente',
  resumoPrestacao: 'Resumo da prestação'
};

const REPORT_CATALOG = [
  {
    id: 'operacionais',
    label: 'Operacionais',
    reports: [
      { id: 'consignacoes', label: 'Consignações', icon: '📦', projections: ['dashboard', 'historico'], viz: 'table', dataPath: 'historico' },
      { id: 'prestacao', label: 'Fechamento', icon: '📋', projections: ['dashboard', 'resumoPrestacao'], viz: 'cards', dataPath: 'resumoPrestacao' },
      { id: 'entregas', label: 'Entregas', icon: '🚚', projections: ['timeline', 'historico'], viz: 'timeline', dataPath: 'timeline' },
      { id: 'movimentacoes', label: 'Movimentações', icon: '🔄', projections: ['historico'], viz: 'table', dataPath: 'historico' },
      { id: 'conta-corrente', label: 'Conta Corrente', icon: '🏦', projections: ['contaCorrente', 'saldos'], viz: 'cards', dataPath: 'contaCorrente' }
    ]
  },
  {
    id: 'comerciais',
    label: 'Comerciais',
    reports: [
      { id: 'clientes', label: 'Clientes', icon: '👥', projections: ['dashboard', 'indicadores'], viz: 'ranking', dataPath: 'rankings.topClientes' },
      { id: 'produtos', label: 'Produtos', icon: '🏷️', projections: ['dashboard', 'indicadores'], viz: 'ranking', dataPath: 'rankings.topProdutos' },
      { id: 'operadores', label: 'Operadores', icon: '👤', projections: ['dashboard', 'indicadores'], viz: 'ranking', dataPath: 'rankings.topOperadores' },
      { id: 'performance', label: 'Desempenho', icon: '📈', projections: ['indicadores'], viz: 'indicators', dataPath: 'indicators' },
      { id: 'conversao', label: 'Conversão', icon: '🎯', projections: ['indicadores', 'dashboard'], viz: 'chart', dataPath: 'graphs.conversao' }
    ]
  },
  {
    id: 'financeiros',
    label: 'Financeiros',
    reports: [
      { id: 'recebimentos', label: 'Recebimentos', icon: '💰', projections: ['indicadores', 'dashboard'], viz: 'chart', dataPath: 'graphs.recebimentos' },
      { id: 'perdas', label: 'Perdas', icon: '⚠️', projections: ['indicadores', 'dashboard'], viz: 'chart', dataPath: 'graphs.perdas' },
      { id: 'cortesias', label: 'Cortesias', icon: '🎁', projections: ['indicadores', 'dashboard'], viz: 'chart', dataPath: 'graphs.cortesias' },
      { id: 'saldo', label: 'Saldo', icon: '💳', projections: ['saldos', 'dashboard'], viz: 'cards', dataPath: 'saldos' },
      { id: 'limite', label: 'Limite', icon: '📊', projections: ['saldos', 'situacaoCliente'], viz: 'cards', dataPath: 'saldos' }
    ]
  },
  {
    id: 'executivos',
    label: 'Executivos',
    reports: [
      { id: 'kpis', label: 'KPIs', icon: '📊', projections: ['dashboard', 'indicadores'], viz: 'cards', dataPath: 'cards' },
      { id: 'rankings', label: 'Rankings', icon: '🏆', projections: ['dashboard', 'indicadores'], viz: 'ranking', dataPath: 'rankings' },
      { id: 'comparativos', label: 'Comparativos', icon: '⚖️', projections: ['dashboard', 'indicadores'], viz: 'heatmap', dataPath: 'comparativos' },
      { id: 'indicadores', label: 'Indicadores', icon: '📉', projections: ['indicadores'], viz: 'indicators', dataPath: 'indicators' },
      { id: 'insights', label: 'Análises', icon: '💡', projections: ['insights', 'dashboard'], viz: 'table', dataPath: 'insights' }
    ]
  }
];

function pick(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function flattenReports() {
  return REPORT_CATALOG.flatMap((g) => g.reports.map((r) => ({ ...r, groupId: g.id, groupLabel: g.label })));
}

function findReport(reportId) {
  return flattenReports().find((r) => r.id === reportId) || flattenReports()[0];
}

function buildExtendedFilterParams(filters = {}) {
  const params = buildFilterParams({
    clienteId: filters.clienteId || undefined,
    consignacaoId: filters.consignacaoId || undefined,
    dataInicio: filters.dataInicio || undefined,
    dataFim: filters.dataFim || undefined,
    operadorId: filters.operador || filters.operadorId || undefined,
    limite: filters.limite || 50
  });
  if (filters.produtoId) params.produtoId = filters.produtoId;
  if (filters.situacao) params.situacao = filters.situacao;
  if (filters.tipo) params.tipo = filters.tipo;
  if (filters.categoria) params.categoria = filters.categoria;
  return params;
}

function mapTableRow(item, index) {
  return {
    id: item.id || `row-${index}`,
    data: item.data || item.dataMovimentacao || item.periodo || '-',
    documento: item.documento || item.documentoNumero || item.consignacaoId || '-',
    tipo: item.tipo || item.tipoMovimentacao || item.categoria || '-',
    descricao: item.descricao || item.titulo || item.mensagem || item.nome || '-',
    valor: item.valor ?? item.total ?? item.quantidade ?? '-',
    operador: item.usuarioId || item.operador || '-',
    status: item.status || item.situacao || '-',
    raw: item
  };
}

function mapRankingRow(item, index) {
  return {
    posicao: item.posicao ?? item.rank ?? index + 1,
    nome: item.nome || item.cliente || item.produto || item.operador || item.label || '-',
    valor: item.valor ?? item.total ?? item.quantidade ?? 0,
    percentual: item.percentual ?? item.conversao ?? null,
    raw: item
  };
}

function mapComparativeItem(item, index) {
  return {
    id: item.id || item.chave || `comp-${index}`,
    label: item.label || item.periodo || item.dimensao || '-',
    atual: item.atual ?? item.valorAtual ?? item.periodoAtual ?? 0,
    anterior: item.anterior ?? item.valorAnterior ?? item.periodoAnterior ?? 0,
    variacao: item.variacao ?? item.percentual ?? item.tendencia ?? null,
    raw: item
  };
}

function buildComparativos(dashboard = {}, indicadores = {}) {
  const comp = dashboard.comparativos || indicadores.comparativos || {};
  const tendencias = dashboard.tendencias || indicadores.tendencias || {};

  const sections = [
    { key: 'hojeOntem', label: 'Hoje × Ontem', items: comp.hojeOntem || comp.dia || [] },
    { key: 'semanaSemana', label: 'Semana × Semana', items: comp.semanaSemana || comp.semana || [] },
    { key: 'mesMes', label: 'Mês × Mês', items: comp.mesMes || comp.mes || [] },
    { key: 'anoAno', label: 'Ano × Ano', items: comp.anoAno || comp.ano || [] },
    { key: 'filialFilial', label: 'Filial × Filial', items: comp.filialFilial || comp.filiais || [] },
    { key: 'operadorOperador', label: 'Operador × Operador', items: comp.operadorOperador || comp.operadores || [] },
    { key: 'clienteCliente', label: 'Cliente × Cliente', items: comp.clienteCliente || comp.clientes || [] }
  ];

  if (!sections.some((s) => s.items.length) && Object.keys(tendencias).length) {
    sections[0].items = Object.entries(tendencias).map(([key, val]) => ({
      chave: key,
      label: key,
      atual: typeof val === 'object' ? (val.valor ?? val.atual) : val,
      anterior: typeof val === 'object' ? val.anterior : null,
      variacao: typeof val === 'object' ? (val.percentual ?? val.variacao) : null
    }));
  }

  return sections.map((section) => ({
    ...section,
    items: (section.items || []).map(mapComparativeItem)
  }));
}

function buildSaldosView(saldos = {}) {
  const data = saldos.saldos || saldos;
  return [
    { label: 'Saldo Consignado', value: data.saldoConsignado ?? data.valorConsignado, format: 'currency' },
    { label: 'Saldo em Aberto', value: data.saldoEmAberto ?? data.saldo, format: 'currency' },
    { label: 'Limite Comercial', value: data.limiteComercial ?? data.limite, format: 'currency' },
    { label: 'Limite Utilizado', value: data.limiteUtilizado ?? data.limiteConsumido, format: 'currency' },
    { label: 'Limite Disponível', value: data.limiteDisponivel, format: 'currency' }
  ];
}

function buildContaCorrenteCards(contaCorrente = {}) {
  return [
    { label: 'Saldo Inicial', value: contaCorrente.saldoInicial, format: 'currency' },
    { label: 'Recebimentos', value: contaCorrente.pagamentos, format: 'currency' },
    { label: 'Perdas', value: contaCorrente.perdas, format: 'currency' },
    { label: 'Cortesias', value: contaCorrente.cortesias, format: 'currency' },
    { label: 'Saldo Atual', value: contaCorrente.saldoAtual, format: 'currency' }
  ];
}

function buildResumoPrestacaoCards(resumo = {}) {
  return [
    { label: 'Saldo Consignado', value: resumo.saldoConsignado, format: 'currency' },
    { label: 'Saldo Vendido', value: resumo.saldoVendido, format: 'currency' },
    { label: 'Saldo Devolvido', value: resumo.saldoDevolvido, format: 'currency' },
    { label: 'Saldo Perdido', value: resumo.saldoPerdido, format: 'currency' },
    { label: 'Saldo em Aberto', value: resumo.saldoEmAberto, format: 'currency' }
  ];
}

function buildInsightRows(dashboard = {}, insightsPayload = {}) {
  return buildInsights(dashboard, insightsPayload).map((ins, i) => ({
    id: ins.id || `insight-${i}`,
    titulo: ins.titulo,
    tipo: classifyInsightPriority(ins.severidade, ins.prioridade),
    categoria: ins.categoria,
    mensagem: ins.mensagem,
    acao: ins.acaoRecomendada,
    raw: ins
  }));
}

function buildInsightGroups(dashboard = {}, insightsPayload = {}) {
  const insights = buildInsights(dashboard, insightsPayload);
  const alertas = buildAlerts(dashboard);
  const groups = {
    alertas: alertas.map((a) => ({ ...a, grupo: 'alerta' })),
    riscos: insights.filter((i) => classifyInsightPriority(i.severidade, i.prioridade) === 'critico'),
    oportunidades: insights.filter((i) => String(i.categoria).toUpperCase().includes('OPORTUNIDADE')),
    tendencias: insights.filter((i) => String(i.categoria).toUpperCase().includes('TENDENCIA')),
    anomalias: insights.filter((i) => String(i.categoria).toUpperCase().includes('ANOMALIA')),
    recomendacoes: insights.filter((i) => i.acaoRecomendada)
  };
  if (!groups.oportunidades.length && !groups.tendencias.length) {
    groups.recomendacoes = insights;
  }
  return groups;
}

function buildViewFromPayload(payload = {}) {
  const { dashboard = {}, indicadores = {}, insights = {} } = payload;
  return {
    cards: buildExecutiveCards(dashboard, indicadores),
    indicators: buildIndicators(indicadores),
    graphs: buildGraphSeries(indicadores, dashboard),
    rankings: buildRankings(dashboard, indicadores),
    insights: buildInsightRows(dashboard, insights),
    insightGroups: buildInsightGroups(dashboard, insights),
    comparativos: buildComparativos(dashboard, indicadores),
    saldos: buildSaldosView(payload.saldos || {}),
    contaCorrente: buildContaCorrenteCards(payload.contaCorrente || {}),
    resumoPrestacao: buildResumoPrestacaoCards(payload.resumoPrestacao || {}),
    historico: (Array.isArray(payload.historico) ? payload.historico : []).map(mapTableRow),
    timeline: payload.timeline || []
  };
}

function resolveReportData(report, view = {}) {
  if (!report) return { type: 'empty', data: [] };

  const type = report.viz;
  let data = pick(view, report.dataPath);

  if (report.id === 'rankings' && data && typeof data === 'object' && !Array.isArray(data)) {
    return { type: 'ranking-grid', data: view.rankings };
  }
  if (report.id === 'comparativos') {
    return { type: 'heatmap', data: view.comparativos };
  }
  if (report.id === 'insights') {
    return { type: 'table', data: view.insights, columns: insightColumns() };
  }
  if (type === 'table') {
    const rows = Array.isArray(data) ? data : view.historico;
    return { type: 'table', data: rows, columns: tableColumns() };
  }
  if (type === 'ranking') {
    const rows = Array.isArray(data) ? data.map(mapRankingRow) : [];
    return { type: 'ranking', data: rows, columns: rankingColumns() };
  }
  if (type === 'cards') {
    const cards = Array.isArray(data) ? data : (view[report.dataPath] || view.saldos || view.cards);
    return { type: 'cards', data: cards || [] };
  }
  if (type === 'chart') {
    const series = Array.isArray(data) ? data : (pick(view.graphs, report.dataPath.replace('graphs.', '')) || []);
    return { type: 'chart', data: series, title: report.label };
  }
  if (type === 'timeline') {
    return { type: 'timeline', data: view.timeline || [] };
  }
  if (type === 'indicators') {
    return { type: 'indicators', data: view.indicators || [] };
  }
  if (type === 'heatmap') {
    return { type: 'heatmap', data: view.comparativos || [] };
  }

  return { type: 'empty', data: [] };
}

function tableColumns() {
  return [
    { key: 'data', label: 'Data' },
    { key: 'documento', label: 'Documento' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'descricao', label: 'Descrição' },
    { key: 'valor', label: 'Valor' },
    { key: 'operador', label: 'Operador' },
    { key: 'status', label: 'Status' }
  ];
}

function rankingColumns() {
  return [
    { key: 'posicao', label: '#' },
    { key: 'nome', label: 'Nome' },
    { key: 'valor', label: 'Valor' },
    { key: 'percentual', label: '%' }
  ];
}

function insightColumns() {
  return [
    { key: 'titulo', label: 'Título' },
    { key: 'tipo', label: 'Prioridade' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'mensagem', label: 'Mensagem' }
  ];
}

function applySearchFilter(rows, search = '') {
  const q = (search || '').toLowerCase().trim();
  if (!q) return rows;
  return rows.filter((row) => Object.values(row).some((v) => String(v || '').toLowerCase().includes(q)));
}

function saveFavorite(item) {
  const favorites = loadFavorites();
  favorites.unshift({ ...item, savedAt: new Date().toISOString() });
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, 30)));
}

function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

function removeFavorite(id) {
  const favorites = loadFavorites().filter((f) => f.id !== id);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function saveLayout(layout) {
  const layouts = loadLayouts();
  layouts.unshift({ ...layout, savedAt: new Date().toISOString() });
  localStorage.setItem(LAYOUTS_KEY, JSON.stringify(layouts.slice(0, 20)));
}

function loadLayouts() {
  try {
    return JSON.parse(localStorage.getItem(LAYOUTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function appendHistory(entry) {
  const history = loadHistory();
  history.unshift({
    id: `exec-${Date.now()}`,
    ...entry,
    executedAt: new Date().toISOString()
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function getProjectionNames(projections = []) {
  return projections.map((p) => PROJECTION_LABELS[p] || p).join(', ');
}

module.exports = {
  REPORT_CATALOG,
  PROJECTION_LABELS,
  flattenReports,
  findReport,
  buildExtendedFilterParams,
  buildViewFromPayload,
  resolveReportData,
  buildComparativos,
  buildInsightGroups,
  applySearchFilter,
  saveFavorite,
  loadFavorites,
  removeFavorite,
  saveLayout,
  loadLayouts,
  appendHistory,
  loadHistory,
  getProjectionNames,
  tableColumns,
  rankingColumns
};
