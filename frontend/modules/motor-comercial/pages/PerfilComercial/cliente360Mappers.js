/**
 * Mapeadores do Cliente 360° Enterprise — Sprint S-5.
 *
 * Apenas transformação de campos; sem cálculos de negócio novos.
 *
 * @module frontend/modules/motor-comercial/pages/PerfilComercial/cliente360Mappers
 */

const CLIENTE360_SECTIONS = [
  { id: 'resumo', title: 'Resumo Comercial', description: 'Indicadores principais do relacionamento comercial' },
  { id: 'timeline', title: 'Linha do Tempo', description: 'História comercial do cliente em ordem cronológica' },
  { id: 'conta-corrente', title: 'Conta Corrente', description: 'Saldo atual e movimentações recentes' },
  { id: 'consignacoes', title: 'Consignações', description: 'Operações comerciais do cliente' },
  { id: 'pendencias', title: 'Pendências', description: 'Itens financeiros, operacionais e comerciais' },
  { id: 'recomendacoes', title: 'Recomendações', description: 'Ações sugeridas e acionáveis' },
  { id: 'guias', title: 'Guias Operacionais', description: 'Procedimentos para o contexto atual do cliente' },
  { id: 'historico', title: 'Histórico', description: 'Alterações cadastrais e eventos comerciais' }
];

const PRIORITY_ORDER = { CRITICAL: 0, ERROR: 1, HIGH: 2, WARNING: 3, INFO: 4 };

function inferTipoPessoa(documento) {
  const digits = String(documento || '').replace(/\D/g, '');
  if (digits.length === 11) return 'Pessoa Física';
  if (digits.length === 14) return 'Pessoa Jurídica';
  return '-';
}

function buildHeaderInfo(perfil = {}, situacao = {}) {
  const cliente = perfil.clienteMestre || (typeof perfil.cliente === 'object' ? perfil.cliente : {}) || {};
  const endereco = cliente.endereco || {};

  return {
    nome: perfil.clienteNome || perfil.cliente || '-',
    tipoPessoa: inferTipoPessoa(perfil.cpfCnpj || cliente.documento),
    documento: perfil.cpfCnpj || cliente.documento || '-',
    telefone: perfil.telefone || cliente.telefone || '-',
    cidadeUf: [endereco.cidade, endereco.uf || endereco.estado].filter(Boolean).join(' / ') || '-',
    situacaoCadastro: perfil.ativo === false ? 'Inativo' : (perfil.bloqueado ? 'Bloqueado' : 'Ativo'),
    perfilComercial: perfil.perfilTipo || '-',
    dataCadastro: cliente.createdAt || perfil.createdAt || null,
    situacaoComercial: situacao.statusGeral || situacao.situacao || (perfil.bloqueado ? 'BLOQUEADO' : 'ATIVO')
  };
}

function extractUltimaMovimentacao(timeline = []) {
  const events = timeline?.eventos || timeline || [];
  if (!events.length) return null;
  const sorted = [...events].sort((a, b) => {
    const da = new Date(a.data || a.dataMovimentacao || 0).getTime();
    const db = new Date(b.data || b.dataMovimentacao || 0).getTime();
    return db - da;
  });
  const last = sorted[0];
  return last?.data || last?.dataMovimentacao || null;
}

function buildResumoComercial(perfil = {}, situacao = {}, score = {}, consignacoes = [], pendenciasView = {}, timeline = {}) {
  const ativos = (consignacoes || []).filter((c) =>
    ['RASCUNHO', 'VALIDADA', 'ENTREGUE', 'EM_PRESTACAO'].includes(String(c.status || '').toUpperCase())
  );

  const limiteComercial = Number(perfil.limiteComercial ?? situacao.limiteComercial ?? situacao.limite ?? 0);
  const saldoUtilizado = Number(
    situacao.saldoDevedor
    ?? situacao.limiteUtilizado
    ?? situacao.saldoConsumido
    ?? situacao.saldo
    ?? perfil.saldoAberto
    ?? 0
  );
  // STAB-02: disponível exclusivo da API — sem Limite − Utilizado local
  const saldoDisponivel = situacao.creditoDisponivel != null
    ? Number(situacao.creditoDisponivel)
    : (situacao.limiteDisponivel != null ? Number(situacao.limiteDisponivel) : null);

  return {
    limiteComercial,
    saldoUtilizado,
    saldoDisponivel,
    saldoDevedor: saldoUtilizado,
    saldoCredor: Number(situacao.saldoCredor ?? 0),
    creditoDisponivel: saldoDisponivel,
    consignacoesAtivas: ativos.length,
    pendencias: pendenciasView?.resumo?.pendentes ?? pendenciasView?.alertas?.length ?? 0,
    ultimaMovimentacao: extractUltimaMovimentacao(timeline) || situacao.ultimaMovimentacao || situacao.ultimaCompra || null
  };
}

function buildContaCorrenteView(contaCorrente = {}, saldos = {}) {
  const lancamentos = contaCorrente.lancamentos || contaCorrente.movimentacoes || [];
  const debitoTipos = new Set(['VENDA_PRESTACAO', 'PERDA', 'VENDA']);
  const creditoTipos = new Set(['PAGAMENTO', 'CREDITO']);

  return {
    saldoAtual: Number(contaCorrente.saldoAtual ?? contaCorrente.saldo ?? saldos.saldoEmAberto ?? 0),
    lancamentos: lancamentos.slice(0, 8),
    debitos: lancamentos.filter((m) => debitoTipos.has(m.tipo || m.tipoMovimentacao)),
    creditos: lancamentos.filter((m) => creditoTipos.has(m.tipo || m.tipoMovimentacao))
  };
}

function sortByPriority(items = []) {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER[String(a.severidade || a.prioridade).toUpperCase()] ?? 9;
    const pb = PRIORITY_ORDER[String(b.severidade || b.prioridade).toUpperCase()] ?? 9;
    return pa - pb;
  });
}

function buildPendenciasGrouped(pendenciasView = {}) {
  const alertas = pendenciasView.alertas || [];
  const financeiras = [];
  const operacionais = [];
  const comerciais = [];

  alertas.forEach((a) => {
    const tag = `${a.categoria || ''} ${a.tipo || ''}`.toUpperCase();
    if (/FINANC|RECEB|PAGAMENTO|CREDITO|COBRANCA/.test(tag)) {
      financeiras.push(a);
    } else if (/OPER|CONSIGN|ENTREGA|ESTOQUE|PRESTAC/.test(tag)) {
      operacionais.push(a);
    } else {
      comerciais.push(a);
    }
  });

  return {
    financeiras: sortByPriority(financeiras).slice(0, 6),
    operacionais: sortByPriority(operacionais).slice(0, 6),
    comerciais: sortByPriority(comerciais).slice(0, 6),
    total: alertas.length
  };
}

function buildRecomendacoesRelevantes(recomendacoesView = {}, limit = 5) {
  const pool = [
    ...(recomendacoesView.prioritarias || []),
    ...(recomendacoesView.recomendacoes || [])
  ];
  const seen = new Set();

  return pool
    .filter((item) => {
      const id = item.id || item.titulo;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      const prioridade = String(item.prioridade || '').toUpperCase();
      return prioridade === 'ALTA' || prioridade === 'URGENTE' || prioridade === 'HIGH' || item.acaoRecomendada;
    })
    .slice(0, limit);
}

function buildGuiasOperacionais(playbooksView = {}) {
  const emAndamento = playbooksView.emAndamento || [];
  const sugeridos = (playbooksView.sugeridos || []).slice(0, 4);
  return {
    emAndamento: emAndamento.slice(0, 4),
    sugeridos,
    total: emAndamento.length + sugeridos.length
  };
}

function buildHistoricoUnificado(historico = [], historicoPerfil = []) {
  const toItem = (h, origem) => ({
    tipo: h.tipoMovimentacao || h.tipo || h.operacao || 'EVENTO',
    descricao: h.motivo || h.descricao || h.detalhes || h.tipoMovimentacao || '-',
    data: h.dataMovimentacao || h.data || h.capturadoEm,
    origem,
    usuario: h.usuarioId || h.usuario || 'Sistema',
    correlationId: h.correlationId || null
  });

  return [
    ...(Array.isArray(historico) ? historico : historico?.movimentacoes || []).map((h) => toItem(h, 'COMERCIAL')),
    ...(Array.isArray(historicoPerfil) ? historicoPerfil : historicoPerfil?.movimentacoes || []).map((h) => toItem(h, 'PERFIL'))
  ].sort((a, b) => new Date(b.data || 0) - new Date(a.data || 0));
}

function normalizeTimelineEvents(timeline = []) {
  const events = timeline?.eventos || timeline || [];
  return events.map((ev) => ({
    ...ev,
    data: ev.data || ev.dataMovimentacao || ev.timestamp,
    tipo: ev.tipo || ev.tipoMovimentacao || ev.titulo,
    descricao: ev.descricao || ev.descricaoResumo || ev.mensagem || ''
  }));
}

module.exports = {
  CLIENTE360_SECTIONS,
  inferTipoPessoa,
  buildHeaderInfo,
  buildResumoComercial,
  buildContaCorrenteView,
  buildPendenciasGrouped,
  buildRecomendacoesRelevantes,
  buildGuiasOperacionais,
  buildHistoricoUnificado,
  normalizeTimelineEvents,
  extractUltimaMovimentacao
};
