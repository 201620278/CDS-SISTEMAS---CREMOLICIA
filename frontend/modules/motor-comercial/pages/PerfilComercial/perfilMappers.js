/**
 * Mapeadores da Central 360° — apenas transformação de campos da API.
 *
 * Sprint O-5.
 *
 * @module frontend/modules/motor-comercial/pages/PerfilComercial/perfilMappers
 */

const { classifyInsightPriority, saveInsightState, getInsightState } = require('../Dashboard/dashboardMappers');

function pick(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function buildExecutiveCard(perfil = {}, situacao = {}, indicadores = {}, contaCorrente = {}, score = {}) {
  return {
    status: situacao.statusGeral || perfil.status || situacao.situacao || '-',
    score: score.score ?? situacao.score ?? indicadores.score ?? '-',
    limite: perfil.limiteComercial ?? situacao.limiteComercial ?? situacao.limite ?? 0,
    limiteUtilizado: situacao.saldoDevedor
      ?? situacao.limiteUtilizado
      ?? situacao.saldoConsumido
      ?? situacao.saldo
      ?? perfil.saldoAberto
      ?? 0,
    // STAB-02: apenas campos oficiais da API — sem recálculo local
    limiteDisponivel: situacao.creditoDisponivel
      ?? situacao.limiteDisponivel
      ?? null,
    saldoDevedor: situacao.saldoDevedor ?? situacao.saldo ?? situacao.saldoEmAberto ?? 0,
    saldoCredor: situacao.saldoCredor ?? 0,
    saldoEmAberto: situacao.saldoDevedor ?? situacao.saldo ?? situacao.saldoEmAberto ?? contaCorrente.saldoEmAberto ?? 0,
    ultimaCompra: situacao.ultimaCompra ?? situacao.ultimaMovimentacao ?? '-',
    ultimaPrestacao: situacao.ultimaPrestacao ?? situacao.prestacaoAtiva?.data ?? '-',
    ultimoRecebimento: situacao.ultimoPagamento ?? contaCorrente.ultimoRecebimento ?? '-',
    diasSemMovimentacao: situacao.diasSemMovimentacao ?? '-',
    clienteDesde: perfil.createdAt ?? perfil.dataCadastro ?? '-',
    riscoComercial: situacao.nivelRisco ?? score.nivelRisco ?? '-',
    proximaAcao: situacao.proximaAcao ?? situacao.recomendacoes?.[0] ?? '-'
  };
}

const KPI_DEFS = [
  { key: 'consignacoesAbertas', label: 'Consignações Abertas', paths: ['consignacoesAbertas', 'quantidadeConsignacoesAbertas'] },
  { key: 'consignacoesEncerradas', label: 'Consignações Encerradas', paths: ['consignacoesEncerradas', 'quantidadeConsignacoesEncerradas'] },
  { key: 'prestacaoAberta', label: 'Fechamento em Aberto', paths: ['prestacaoAberta', 'prestacoesAbertas'] },
  { key: 'prestacaoAtrasada', label: 'Fechamento Atrasado', paths: ['prestacaoAtrasada', 'prestacoesAtrasadas'] },
  { key: 'recebimentos', label: 'Recebimentos', paths: ['valorRecebido', 'recebimentos'], format: 'currency' },
  { key: 'perdas', label: 'Perdas', paths: ['valorPerdido', 'perdas'], format: 'currency' },
  { key: 'cortesias', label: 'Cortesias', paths: ['valorCortesia', 'cortesias'], format: 'currency' },
  { key: 'ticketMedio', label: 'Ticket Médio', paths: ['ticketMedio'], format: 'currency' },
  { key: 'conversao', label: 'Conversão', paths: ['percentualConversao', 'conversao'], format: 'percent' },
  { key: 'tempoMedioPrestacao', label: 'Tempo Médio de Fechamento', paths: ['tempoMedioPrestacao', 'diasMediosPrestacao'], format: 'days' },
  { key: 'tempoMedioRecebimento', label: 'Tempo Médio Recebimento', paths: ['tempoMedioRecebimento', 'diasMediosRecebimento'], format: 'days' }
];

function readValue(source, paths) {
  for (const path of paths) {
    const v = pick(source, path) ?? source?.[path];
    if (v !== undefined && v !== null) return v;
  }
  return null;
}

function buildKpis(situacao = {}, indicadores = {}) {
  const merged = { ...indicadores, ...situacao };
  return KPI_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    value: readValue(merged, def.paths),
    format: def.format || 'number'
  }));
}

function buildIndicators(situacao = {}, indicadores = {}, score = {}) {
  return [
    { label: 'Score', value: score.score ?? situacao.score, format: 'number' },
    { label: 'Conversão', value: indicadores.percentualConversao, format: 'percent' },
    { label: 'Perdas', value: indicadores.valorPerdido, format: 'currency' },
    { label: 'Ticket', value: indicadores.ticketMedio, format: 'currency' },
    { label: 'Recebimento', value: indicadores.valorRecebido ?? indicadores.valorVendido, format: 'currency' },
    { label: 'Pontualidade', value: situacao.pontualidade ?? indicadores.pontualidade, format: 'percent' },
    { label: 'Tempo Médio', value: indicadores.tempoMedioPrestacao ?? indicadores.diasMedios, format: 'days' },
    { label: 'Evolução', value: indicadores.evolucao ?? situacao.evolucao, format: 'text' }
  ];
}

function mapAlertItem(alerta, index) {
  return {
    id: alerta.id || alerta.codigo || alerta.tipo || `alerta-${index}`,
    tipo: alerta.tipo || alerta.categoria || 'ALERTA',
    severidade: alerta.severidade || 'INFO',
    mensagem: alerta.mensagem || alerta.message || alerta.titulo || '',
    acaoRecomendada: alerta.acaoRecomendada || alerta.acao || '',
    link: alerta.link || alerta.rota || ''
  };
}

function buildAlerts(situacao = {}, dashboard = {}) {
  const alertas = [
    ...(situacao.alertas || []),
    ...(dashboard.alertas || [])
  ];
  return alertas.map(mapAlertItem);
}

function buildInsights360(situacao = {}, insightsPayload = {}, dashboard = {}) {
  const fromInsights = insightsPayload.insights || insightsPayload.itens || [];
  const fromRecomendacoes = (situacao.recomendacoes || []).map((r, i) => ({
    id: `rec-${i}`,
    titulo: r.titulo || 'Recomendação',
    mensagem: r.mensagem || r,
    severidade: r.severidade || 'INFO',
    prioridade: r.prioridade || 'NORMAL',
    categoria: r.categoria || 'COMERCIAL'
  }));

  const merged = [
    ...fromInsights,
    ...fromRecomendacoes,
    ...(dashboard.alertas || []).map((a, i) => ({
      id: a.id || `alert-insight-${i}`,
      titulo: a.tipo || 'Alerta',
      mensagem: a.mensagem,
      severidade: a.severidade,
      prioridade: a.prioridade || 'NORMAL'
    }))
  ];

  const { ignored, resolved } = getInsightState();
  return merged
    .filter((item) => !ignored.includes(item.id || item.codigo) && !resolved.includes(item.id || item.codigo))
    .slice(0, 10)
    .map((item, index) => ({
      id: item.id || item.codigo || `insight-${index}`,
      titulo: item.titulo || item.title || 'Análise',
      mensagem: item.mensagem || item.message || '',
      severidade: item.severidade || 'INFO',
      prioridade: item.prioridade || 'NORMAL',
      categoria: item.categoria || 'COMERCIAL',
      tipo: classifyInsightPriority(item.severidade, item.prioridade),
      raw: item
    }));
}

function buildFinanceiro(contaCorrente = {}, saldos = {}, situacao = {}) {
  const saldoConta = contaCorrente.saldoAtual ?? contaCorrente.saldo ?? contaCorrente.saldoEmAberto;
  return {
    saldo: saldoConta ?? saldos.saldoEmAberto ?? situacao.saldo ?? 0,
    saldoEmAberto: contaCorrente.saldoEmAberto ?? saldoConta ?? saldos.saldoEmAberto ?? 0,
    limiteConsumido: situacao.limiteUtilizado ?? saldos.limiteConsumido ?? 0,
    limiteDisponivel: situacao.limiteDisponivel ?? saldos.limiteDisponivel ?? 0,
    movimentacoes: contaCorrente.movimentacoes || saldos.movimentacoes || [],
    evolucao: contaCorrente.evolucao || saldos.evolucao || situacao.evolucaoFinanceira || []
  };
}

function mapPerfilListItem(perfil) {
  const cliente = typeof perfil.cliente === 'object' && perfil.cliente !== null
    ? perfil.cliente
    : null;

  return {
    id: perfil.id,
    clienteId: perfil.clienteId,
    cliente: cliente?.nome || perfil.clienteNome || perfil.cliente || perfil.clienteId,
    clienteNome: cliente?.nome || perfil.clienteNome || null,
    cpfCnpj: cliente?.documento || perfil.cpfCnpj || perfil.documento || '-',
    tipoPerfil: perfil.perfilTipo,
    status: perfil.status || (perfil.bloqueado ? 'BLOQUEADO' : 'ATIVO'),
    limite: perfil.limiteComercial ?? 0,
    saldoUtilizado: perfil.saldoAberto ?? 0,
    saldoDisponivel: perfil.limiteDisponivel ?? 0,
    score: perfil.score ?? perfil.scoreConfiabilidade ?? '-',
    situacao: perfil.bloqueado ? 'BLOQUEADO' : 'ATIVO',
    telefone: cliente?.telefone || perfil.telefone || '',
    codigo: perfil.codigo || perfil.id,
    ativo: perfil.ativo,
    bloqueado: perfil.bloqueado,
    clienteMestre: cliente,
    raw: perfil
  };
}

function mapPerfilDetail(perfil = {}) {
  const listItem = mapPerfilListItem(perfil);
  return {
    ...perfil,
    ...listItem,
    observacoes: perfil.observacoes
  };
}

module.exports = {
  pick,
  buildExecutiveCard,
  buildKpis,
  buildIndicators,
  buildAlerts,
  buildInsights360,
  buildFinanceiro,
  mapPerfilListItem,
  mapPerfilDetail,
  classifyInsightPriority,
  saveInsightState
};
