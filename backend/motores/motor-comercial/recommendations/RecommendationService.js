/**
 * RecommendationService — Motor de Recomendações Comerciais.
 *
 * Sprint O-9: transforma Insights em recomendações de negócio (apoio à decisão).
 *
 * @module motores/motor-comercial/recommendations/RecommendationService
 */

const { mapFontesParaRecomendacoes } = require('./RecommendationMapper');

class RecommendationService {
  /**
   * @param {Object} input
   * @param {Object[]} input.insights
   * @param {Object[]} input.alertas
   * @param {Object} [input.situacao]
   * @param {Object} [input.indicadores]
   * @returns {Object}
   */
  executar(input = {}) {
    const insights = input.insights || [];
    const alertas = input.alertas || [];
    const fontes = [...insights, ...alertas];

    let recomendacoes = mapFontesParaRecomendacoes(fontes);

    recomendacoes = recomendacoes.concat(this._recomendacoesEstrategicas(input));

    const categorias = this._agruparPorCategoria(recomendacoes);
    const kpis = this._calcularKpis(recomendacoes);
    const prioritarias = recomendacoes
      .filter((r) => ['URGENT', 'HIGH'].includes(r.prioridade))
      .slice(0, 10);

    return {
      recomendacoes,
      categorias,
      prioritarias,
      kpis,
      resumo: {
        total: recomendacoes.length,
        prioritarias: prioritarias.length,
        porCategoria: Object.fromEntries(
          Object.entries(categorias).map(([k, v]) => [k, v.length])
        )
      }
    };
  }

  _recomendacoesEstrategicas(input) {
    const extras = [];
    const indicadores = input.indicadores?.indicadores || input.indicadores || {};
    const situacao = input.situacao?.dados || input.situacao || {};
    const clienteId = situacao.clienteId || input.clienteId;

    const conversao = Number(indicadores.percentualConversao ?? 0);
    const perda = Number(indicadores.percentualPerda ?? 0);

    if (conversao >= 70 && clienteId) {
      extras.push({
        id: `rec-estrategico-vip-${clienteId}`,
        titulo: 'Cliente VIP',
        descricao: 'Alta conversão — considerar tratamento prioritário',
        categoria: 'ESTRATEGICO',
        prioridade: 'NORMAL',
        confianca: 75,
        impactoEstimado: 'Retenção e upsell',
        motivo: `Conversão de ${conversao.toFixed(1)}%`,
        origem: 'indicadores',
        insightRelacionado: null,
        projectionRelacionada: 'indicadores',
        clienteId,
        documento: null,
        data: new Date().toISOString(),
        status: 'NOVA',
        tipo: 'CLIENTE_VIP',
        link: `/clientes/${clienteId}`
      });
    }

    if (perda > 15 && clienteId) {
      extras.push({
        id: `rec-estrategico-risco-${clienteId}`,
        titulo: 'Cliente em risco',
        descricao: 'Perdas elevadas — acompanhar de perto',
        categoria: 'ESTRATEGICO',
        prioridade: 'HIGH',
        confianca: 82,
        impactoEstimado: 'Prevenção de churn',
        motivo: `Perda de ${perda.toFixed(1)}%`,
        origem: 'indicadores',
        insightRelacionado: 'PERDA_ELEVADA',
        projectionRelacionada: 'indicadores',
        clienteId,
        documento: null,
        data: new Date().toISOString(),
        status: 'NOVA',
        tipo: 'CLIENTE_EM_RISCO',
        link: `/clientes/${clienteId}`
      });
    }

    if (situacao.statusGeral === 'REGULAR' && !situacao.ultimaMovimentacao && clienteId) {
      extras.push({
        id: `rec-estrategico-inativo-${clienteId}`,
        titulo: 'Cliente inativo',
        descricao: 'Sem movimentação recente — reativar relacionamento',
        categoria: 'ESTRATEGICO',
        prioridade: 'NORMAL',
        confianca: 70,
        impactoEstimado: 'Reativação comercial',
        motivo: 'Ausência de movimentação comercial',
        origem: 'situacao-cliente',
        insightRelacionado: null,
        projectionRelacionada: 'situacao-cliente',
        clienteId,
        documento: null,
        data: new Date().toISOString(),
        status: 'NOVA',
        tipo: 'CLIENTE_INATIVO',
        link: `/clientes/${clienteId}`
      });
    }

    return extras;
  }

  _agruparPorCategoria(recomendacoes) {
    const cats = { CREDITO: [], COMERCIAL: [], FINANCEIRO: [], OPERACIONAL: [], ESTRATEGICO: [] };
    recomendacoes.forEach((r) => {
      const cat = r.categoria || 'COMERCIAL';
      if (cats[cat]) cats[cat].push(r);
      else cats.COMERCIAL.push(r);
    });
    return cats;
  }

  _calcularKpis(recomendacoes) {
    return {
      emitidas: recomendacoes.length,
      aceitas: 0,
      ignoradas: 0,
      concluidas: 0,
      taxaAceitacao: 0,
      impactoEstimadoTotal: recomendacoes.length
        ? Math.round(recomendacoes.reduce((s, r) => s + (r.confianca || 0), 0) / recomendacoes.length)
        : 0
    };
  }
}

module.exports = RecommendationService;
