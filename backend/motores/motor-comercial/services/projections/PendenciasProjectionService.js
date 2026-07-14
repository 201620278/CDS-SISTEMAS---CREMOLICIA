/**
 * PendenciasProjectionService — Central de Pendências e Alertas Inteligentes.
 *
 * Sprint O-8: agrega Projection Services + Shared Insight Engine.
 *
 * @class PendenciasProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const PendenciasDTO = require('../../dto/PendenciasDTO');

const SEVERIDADE_NIVEL = Object.freeze({
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  INFO: 0,
  WARN: 2,
  WARNING: 2
});

const ACAO_POR_TIPO = Object.freeze({
  SALDO_EM_ABERTO: 'Verificar conta corrente e registrar recebimentos pendentes',
  PERDA_ELEVADA: 'Analisar causas de perda e revisar operação',
  PRESTACAO_ATRASADA: 'Contatar cliente e fechar prestação',
  ENTREGA_PENDENTE: 'Registrar entrega da consignação',
  CONSIGNACAO_PARADA: 'Verificar movimentação da consignação',
  CLIENTE_BLOQUEADO: 'Revisar situação do perfil comercial',
  LIMITE_COMPROMETIDO: 'Revisar limite comercial do cliente',
  LIMITE_EXCEDIDO: 'Ajustar limite ou reduzir exposição',
  PRESTACAO_ABERTA: 'Acompanhar prestação em aberto',
  CONVERSAO_BAIXA: 'Revisar mix de produtos e estratégia comercial',
  CORTESIAS_ELEVADAS: 'Auditar cortesias concedidas',
  PAGAMENTO_PENDENTE: 'Registrar pagamento pendente',
  RECEBIMENTOS_ATRASADOS: 'Cobrar recebimentos em atraso'
});

const ROTA_POR_TIPO = Object.freeze({
  SALDO_EM_ABERTO: '/conta-corrente',
  PRESTACAO_ATRASADA: '/consignacoes',
  ENTREGA_PENDENTE: '/consignacoes',
  PRESTACAO_ABERTA: '/consignacoes',
  CLIENTE_BLOQUEADO: '/clientes',
  LIMITE_COMPROMETIDO: '/clientes',
  PERDA_ELEVADA: '/indicadores',
  CONVERSAO_BAIXA: '/indicadores'
});

function nivelSeveridade(sev) {
  return SEVERIDADE_NIVEL[String(sev || 'INFO').toUpperCase()] ?? 0;
}

function classificarFaixa(severidade, prioridade) {
  const sev = String(severidade || '').toUpperCase();
  const pri = String(prioridade || '').toUpperCase();
  if (sev === 'CRITICAL' || pri === 'URGENT') return 'criticas';
  if (sev === 'HIGH' || pri === 'HIGH') return 'importantes';
  return 'informativas';
}

function scorePrioridade(alerta) {
  return nivelSeveridade(alerta.severidade) * 10 + (alerta.prioridade === 'URGENT' ? 5 : alerta.prioridade === 'HIGH' ? 3 : 1);
}

class PendenciasProjectionService extends BaseProjectionService {
  constructor(deps = {}) {
    super(deps);
    this._dashboardService = deps.dashboardService ?? null;
    this._insightsService = deps.insightsService ?? null;
  }

  async validar(_contexto) {
    if (!this._dashboardService || !this._insightsService) {
      throw new Error('Projection services de pendências não configurados');
    }
  }

  async consultar(contexto) {
    const ctx = contexto.toJSON ? contexto.toJSON() : contexto;
    const [dashboardResult, insightsResult] = await Promise.all([
      this._dashboardService.executar(ctx),
      this._insightsService.executar(ctx)
    ]);
    return { dashboardResult, insightsResult };
  }

  _normalizarAlerta(raw, index, origem = 'dashboard') {
    const tipo = raw.tipo || raw.codigo || 'ALERTA';
    const severidade = raw.severidade || raw.severity || 'INFO';
    const prioridade = raw.prioridade || raw.priority || 'NORMAL';
    const dados = raw.dados || {};
    const clienteId = raw.clienteId || dados.clienteId || null;
    const consignacaoId = raw.consignacaoId || dados.consignacaoId || null;
    const documento = raw.documento || dados.documento || null;

    return {
      id: raw.id || `${tipo}-${index}`,
      categoria: raw.categoria || this._categoriaPorTipo(tipo),
      severidade,
      prioridade,
      clienteId,
      cliente: raw.cliente || dados.cliente || (clienteId ? `Cliente #${clienteId}` : null),
      consignacaoId,
      documento,
      descricao: raw.descricao || raw.titulo || raw.mensagem || raw.message || tipo,
      motivo: raw.motivo || raw.mensagem || raw.message || '',
      impacto: raw.impacto || this._impactoPorSeveridade(severidade),
      acaoRecomendada: raw.acaoRecomendada || raw.acao || ACAO_POR_TIPO[tipo] || 'Verificar situação',
      data: raw.data || new Date().toISOString(),
      responsavel: raw.responsavel || null,
      status: raw.status || 'PENDENTE',
      origemProjecao: raw.origemProjecao || dados.origemProjecao || origem,
      origemInsight: raw.origemInsight || (origem === 'shared-insight-engine' ? 'shared-insight-engine' : null),
      link: raw.link || raw.rota || this._linkPorContexto(tipo, clienteId, consignacaoId),
      tipo,
      raw
    };
  }

  _categoriaPorTipo(tipo) {
    const map = {
      SALDO_EM_ABERTO: 'FINANCEIRO',
      PAGAMENTO_PENDENTE: 'FINANCEIRO',
      RECEBIMENTOS_ATRASADOS: 'FINANCEIRO',
      LIMITE_COMPROMETIDO: 'FINANCEIRO',
      LIMITE_EXCEDIDO: 'FINANCEIRO',
      PRESTACAO_ATRASADA: 'COMERCIAL',
      CONSIGNACAO_PARADA: 'COMERCIAL',
      CLIENTE_SEM_MOVIMENTACAO: 'COMERCIAL',
      CLIENTE_BLOQUEADO: 'COMERCIAL',
      ENTREGA_PENDENTE: 'OPERACIONAL',
      PRESTACAO_ABERTA: 'OPERACIONAL',
      ERRO_SINCRONIZACAO: 'OPERACIONAL',
      INTEGRACAO_PENDENTE: 'OPERACIONAL',
      QUEDA_VENDAS: 'INTELIGENCIA',
      PERDA_ELEVADA: 'INTELIGENCIA',
      CORTESIAS_ELEVADAS: 'INTELIGENCIA',
      CONVERSAO_BAIXA: 'INTELIGENCIA',
      ANOMALIA: 'INTELIGENCIA'
    };
    return map[tipo] || 'COMERCIAL';
  }

  _impactoPorSeveridade(sev) {
    const map = {
      CRITICAL: 'Alto impacto operacional e financeiro',
      HIGH: 'Impacto significativo na operação',
      MEDIUM: 'Requer atenção em curto prazo',
      LOW: 'Monitoramento recomendado',
      INFO: 'Informativo'
    };
    return map[String(sev).toUpperCase()] || 'Avaliar impacto';
  }

  _linkPorContexto(tipo, clienteId, consignacaoId) {
    if (consignacaoId) return `/consignacoes/${consignacaoId}`;
    if (clienteId) return `/clientes/${clienteId}`;
    return ROTA_POR_TIPO[tipo] || '/pendencias';
  }

  async projetar({ dashboardResult, insightsResult }, contexto) {
    const dashboardData = dashboardResult.dados || dashboardResult;
    const alertasDashboard = (dashboardData.alertas || []).map((a, i) =>
      this._normalizarAlerta({ ...a, origemProjecao: 'dashboard' }, i, 'dashboard')
    );

    const insightsData = insightsResult.dados || insightsResult;
    const alertasInsights = (insightsData.insights || []).map((item, i) =>
      this._normalizarAlerta({
        ...item,
        tipo: item.codigo || item.tipo,
        descricao: item.titulo,
        motivo: item.mensagem,
        origemInsight: 'shared-insight-engine'
      }, `ins-${i}`, 'shared-insight-engine')
    );

    const merged = [...alertasInsights, ...alertasDashboard];
    const dedup = [];
    const seen = new Set();
    merged.forEach((a) => {
      const key = `${a.tipo}-${a.clienteId}-${a.consignacaoId}`;
      if (seen.has(key)) return;
      seen.add(key);
      dedup.push(a);
    });

    const criticas = [];
    const importantes = [];
    const informativas = [];
    const categorias = {
      FINANCEIRO: [],
      COMERCIAL: [],
      OPERACIONAL: [],
      INTELIGENCIA: []
    };

    dedup.forEach((alerta) => {
      const faixa = classificarFaixa(alerta.severidade, alerta.prioridade);
      if (faixa === 'criticas') criticas.push(alerta);
      else if (faixa === 'importantes') importantes.push(alerta);
      else informativas.push(alerta);

      const cat = alerta.categoria || 'COMERCIAL';
      if (categorias[cat]) categorias[cat].push(alerta);
    });

    const resumo = {
      total: dedup.length,
      criticos: criticas.length,
      altos: importantes.length,
      medios: informativas.filter((a) => String(a.severidade).toUpperCase() === 'MEDIUM').length,
      baixos: informativas.filter((a) => ['LOW', 'INFO'].includes(String(a.severidade).toUpperCase())).length,
      resolvidosHoje: 0,
      pendentes: dedup.length,
      tempoMedioResolucaoHoras: null
    };

    const proximasAcoes = [...dedup]
      .sort((a, b) => scorePrioridade(b) - scorePrioridade(a))
      .slice(0, 10)
      .map((a) => ({
        id: a.id,
        titulo: a.descricao,
        acao: a.acaoRecomendada,
        prioridade: a.prioridade,
        severidade: a.severidade,
        link: a.link,
        clienteId: a.clienteId,
        consignacaoId: a.consignacaoId
      }));

    const dto = PendenciasDTO.create({
      resumo,
      criticas,
      importantes,
      informativas,
      alertas: dedup,
      proximasAcoes,
      categorias
    });

    return {
      dados: dto.toJSON(),
      metadata: {
        escopo: contexto.clienteId ? 'CLIENTE' : 'GLOBAL',
        origem: ['dashboard', 'shared-insight-engine'],
        geradoEm: new Date().toISOString()
      }
    };
  }
}

module.exports = PendenciasProjectionService;
