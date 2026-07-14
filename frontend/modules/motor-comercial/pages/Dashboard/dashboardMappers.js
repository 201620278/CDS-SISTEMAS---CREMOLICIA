/**
 * Mapeadores do Dashboard Executivo — apenas transformação de campos da API.
 *
 * Sprint O-4: sem cálculos de negócio no Frontend.
 *
 * @module frontend/modules/motor-comercial/pages/Dashboard/dashboardMappers
 */

const INSIGHT_IGNORED_KEY = 'motor-comercial:insights-ignorados';
const INSIGHT_RESOLVED_KEY = 'motor-comercial:insights-resolvidos';

function pick(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function mapTrend(source) {
  if (!source) return { trend: 'neutral', trendValue: 0 };
  if (typeof source === 'object') {
    const dir = String(source.direcao || source.direction || source.trend || '').toUpperCase();
    const value = Number(source.percentual ?? source.valor ?? source.value ?? 0);
    if (dir.includes('UP') || dir === '▲' || dir === 'ALTA') return { trend: 'up', trendValue: value };
    if (dir.includes('DOWN') || dir === '▼' || dir === 'BAIXA') return { trend: 'down', trendValue: value };
    return { trend: 'neutral', trendValue: value };
  }
  const text = String(source).toUpperCase();
  if (text.includes('UP') || text === '▲') return { trend: 'up', trendValue: 0 };
  if (text.includes('DOWN') || text === '▼') return { trend: 'down', trendValue: 0 };
  return { trend: 'neutral', trendValue: 0 };
}

const EXECUTIVE_CARD_DEFS = [
  { key: 'recebimentosDia', title: 'Recebimentos do Dia', paths: ['recebimentosDia', 'valorRecebidoDia'], format: 'currency' },
  { key: 'saldoConsignado', title: 'Saldo Consignado', paths: ['saldoConsignado', 'valorConsignado'], format: 'currency' },
  { key: 'saldoEmAberto', title: 'Saldo em Aberto', paths: ['saldoEmAberto'], format: 'currency' },
  { key: 'prestacaoAberta', title: 'Prestação Aberta', paths: ['prestacaoAberta', 'quantidadePrestacoesAbertas'], format: 'number' },
  { key: 'prestacaoAtrasada', title: 'Prestação Atrasada', paths: ['prestacaoAtrasada', 'quantidadePrestacoesAtrasadas'], format: 'number' },
  { key: 'clientesAtivos', title: 'Clientes Ativos', paths: ['clientesAtivos', 'quantidadeClientesAtivos'], format: 'number' },
  { key: 'ticketMedio', title: 'Ticket Médio', paths: ['ticketMedio'], format: 'currency' },
  { key: 'conversao', title: 'Conversão', paths: ['percentualConversao', 'conversao'], format: 'percent' },
  { key: 'perdas', title: 'Perdas', paths: ['valorPerdido', 'perdas'], format: 'currency' },
  { key: 'cortesias', title: 'Cortesias', paths: ['valorCortesia', 'cortesias'], format: 'currency' },
  { key: 'recebimentos', title: 'Recebimentos', paths: ['valorRecebido', 'recebimentos'], format: 'currency' },
  { key: 'receberHoje', title: 'Receber Hoje', paths: ['receberHoje', 'valorReceberHoje'], format: 'currency' },
  { key: 'receberSemana', title: 'Receber Esta Semana', paths: ['receberSemana', 'valorReceberSemana'], format: 'currency' },
  { key: 'receberMes', title: 'Receber Este Mês', paths: ['receberMes', 'valorReceberMes'], format: 'currency' }
];

function readKpiValue(kpis, paths) {
  for (const path of paths) {
    const value = pick(kpis, path) ?? kpis?.[path];
    if (value !== undefined && value !== null) return value;
  }
  return 0;
}

function buildExecutiveCards(dashboard = {}, indicadores = {}) {
  const kpis = { ...(dashboard.totais || {}), ...(dashboard.kpis || {}), ...indicadores };
  const tendencias = dashboard.tendencias || indicadores.tendencias || {};

  if (Array.isArray(dashboard.cards) && dashboard.cards.length) {
    return dashboard.cards.map((card) => ({
      key: card.chave || card.key || card.titulo,
      title: card.titulo || card.title,
      value: card.valor ?? card.value ?? 0,
      format: card.formato || card.format || 'number',
      color: card.cor || card.color || 'primary',
      ...mapTrend(card.tendencia || tendencias[card.chave || card.key]),
      raw: card
    }));
  }

  return EXECUTIVE_CARD_DEFS.map((def) => ({
    key: def.key,
    title: def.title,
    value: readKpiValue(kpis, def.paths),
    format: def.format,
    color: def.color || 'primary',
    ...mapTrend(tendencias[def.key]),
    raw: { key: def.key, value: readKpiValue(kpis, def.paths) }
  }));
}

function mapAlertItem(alerta, index) {
  return {
    id: alerta.id || alerta.codigo || `alerta-${index}`,
    tipo: alerta.tipo || alerta.categoria || 'ALERTA',
    severidade: alerta.severidade || alerta.severity || 'INFO',
    prioridade: alerta.prioridade || alerta.priority || 'NORMAL',
    mensagem: alerta.mensagem || alerta.message || alerta.titulo || '',
    acaoRecomendada: alerta.acaoRecomendada || alerta.acao || alerta.recomendacao || '',
    link: alerta.link || alerta.url || alerta.rota || '',
    raw: alerta
  };
}

function buildAlerts(dashboard = {}) {
  return (dashboard.alertas || []).map(mapAlertItem);
}

function mapInsightItem(item, index) {
  return {
    id: item.id || item.codigo || `insight-${index}`,
    titulo: item.titulo || item.title || 'Análise',
    mensagem: item.mensagem || item.message || '',
    severidade: item.severidade || item.severity || 'INFO',
    prioridade: item.prioridade || item.priority || 'NORMAL',
    categoria: item.categoria || item.category || 'COMERCIAL',
    acaoRecomendada: item.acaoRecomendada || item.acao || '',
    link: item.link || item.rota || '',
    dados: item.dados || item.data || {},
    raw: item
  };
}

function getInsightState() {
  try {
    return {
      ignored: JSON.parse(localStorage.getItem(INSIGHT_IGNORED_KEY) || '[]'),
      resolved: JSON.parse(localStorage.getItem(INSIGHT_RESOLVED_KEY) || '[]')
    };
  } catch {
    return { ignored: [], resolved: [] };
  }
}

function saveInsightState(type, id) {
  const state = getInsightState();
  const list = type === 'ignored' ? state.ignored : state.resolved;
  if (!list.includes(id)) list.push(id);
  localStorage.setItem(
    type === 'ignored' ? INSIGHT_IGNORED_KEY : INSIGHT_RESOLVED_KEY,
    JSON.stringify(list)
  );
}

function buildInsights(dashboard = {}, insightsPayload = {}) {
  const fromInsights = insightsPayload.insights || insightsPayload.itens || insightsPayload.items || [];
  const fromAlertas = (dashboard.alertas || []).map((a, i) => mapInsightItem({
    ...a,
    titulo: a.titulo || a.tipo || 'Alerta Comercial',
    mensagem: a.mensagem || a.message
  }, i));

  const merged = [...fromInsights.map(mapInsightItem), ...fromAlertas];
  const { ignored, resolved } = getInsightState();

  return merged
    .filter((item) => !ignored.includes(item.id) && !resolved.includes(item.id))
    .slice(0, 10);
}

function classifyInsightPriority(severidade, prioridade) {
  const sev = String(severidade).toUpperCase();
  const pri = String(prioridade).toUpperCase();
  if (sev === 'CRITICAL' || pri === 'URGENT') return 'critico';
  if (sev === 'HIGH' || pri === 'HIGH') return 'alto';
  if (sev === 'MEDIUM' || pri === 'NORMAL') return 'medio';
  return 'baixo';
}

function buildIndicators(indicadores = {}) {
  return [
    { key: 'conversao', label: 'Conversão', value: indicadores.percentualConversao, format: 'percent' },
    { key: 'perdas', label: 'Perdas', value: indicadores.valorPerdido, format: 'currency' },
    { key: 'recebimento', label: 'Recebimento', value: indicadores.valorRecebido ?? indicadores.valorVendido, format: 'currency' },
    { key: 'prazoMedio', label: 'Prazo Médio', value: indicadores.prazoMedio, format: 'days' },
    { key: 'ticketMedio', label: 'Ticket Médio', value: indicadores.ticketMedio, format: 'currency' },
    { key: 'tempoPrestacao', label: 'Tempo Médio Prestação', value: indicadores.tempoMedioPrestacao, format: 'days' },
    { key: 'tempoEntrega', label: 'Tempo Médio Entrega', value: indicadores.tempoMedioEntrega, format: 'days' }
  ];
}

function buildGraphSeries(indicadores = {}, dashboard = {}) {
  const graficos = indicadores.graficos || dashboard.graficos || {};
  return {
    consignacoesPorPeriodo: graficos.consignacoesPorPeriodo || indicadores.consignacoesPorPeriodo || [],
    recebimentos: graficos.recebimentos || indicadores.recebimentosPorPeriodo || [],
    prestacao: graficos.prestacao || indicadores.prestacaoPorPeriodo || [],
    perdas: graficos.perdas || indicadores.perdasPorPeriodo || [],
    conversao: graficos.conversao || indicadores.conversaoPorPeriodo || [],
    clientesAtivos: graficos.clientesAtivos || indicadores.clientesAtivosPorPeriodo || [],
    evolucaoDiaria: graficos.evolucaoDiaria || indicadores.evolucaoDiaria || []
  };
}

function buildRankings(dashboard = {}, indicadores = {}) {
  const rankings = dashboard.rankings || indicadores.rankings || {};
  return {
    topClientes: rankings.topClientes || rankings.clientes || [],
    topConsignados: rankings.topConsignados || rankings.consignados || [],
    topProdutos: rankings.topProdutos || rankings.produtos || [],
    topOperadores: rankings.topOperadores || rankings.operadores || [],
    maiorConversao: rankings.maiorConversao || [],
    maiorPerda: rankings.maiorPerda || [],
    maiorRecebimento: rankings.maiorRecebimento || [],
    maiorTicket: rankings.maiorTicket || []
  };
}

function buildPendencias(dashboard = {}, indicadores = {}) {
  const pendencias = dashboard.pendencias || indicadores.pendencias || [];
  if (pendencias.length) return pendencias.map((p, i) => mapAlertItem(p, i));
  return buildAlerts(dashboard).filter((a) =>
    ['PRESTACAO_ATRASADA', 'ENTREGA_PENDENTE', 'CONSIGNACAO_PARADA', 'CLIENTE_BLOQUEADO', 'LIMITE_EXCEDIDO'].includes(a.tipo)
  );
}

function buildFilterParams(filters = {}) {
  const params = {};
  if (filters.clienteId) params.clienteId = filters.clienteId;
  if (filters.consignacaoId) params.consignacaoId = filters.consignacaoId;
  if (filters.dataInicio) params.dataInicio = filters.dataInicio;
  if (filters.dataFim) params.dataFim = filters.dataFim;
  if (filters.operadorId) params.usuarioId = filters.operadorId;
  if (filters.limite) params.limite = filters.limite;
  return params;
}

module.exports = {
  pick,
  mapTrend,
  buildExecutiveCards,
  buildAlerts,
  buildInsights,
  classifyInsightPriority,
  buildIndicators,
  buildGraphSeries,
  buildRankings,
  buildPendencias,
  buildFilterParams,
  saveInsightState,
  getInsightState
};
