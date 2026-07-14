/**
 * InsightsProjectionService — executa Shared Insight Engine sobre projeções comerciais.
 *
 * Sprint O-8.
 *
 * @class InsightsProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const InsightContext = require('../../../../shared/insights/context/InsightContext');

class InsightsProjectionService extends BaseProjectionService {
  constructor(deps = {}) {
    super(deps);
    this._insightService = deps.insightService ?? null;
    this._dashboardService = deps.dashboardService ?? null;
    this._indicadoresService = deps.indicadoresService ?? null;
    this._saldoService = deps.saldoService ?? null;
    this._situacaoClienteService = deps.situacaoClienteService ?? null;
  }

  async validar(_contexto) {
    if (!this._insightService) {
      throw new Error('InsightService não configurado');
    }
  }

  async consultar(contexto) {
    const metadata = contexto.toJSON ? contexto.toJSON() : contexto;
    const insightContext = new InsightContext({
      projectionServices: {
        dashboard: this._dashboardService,
        indicadores: this._indicadoresService,
        saldos: this._saldoService,
        situacaoCliente: this._situacaoClienteService
      },
      repositories: {
        consignacaoRepository: this._consignacaoRepository,
        perfilComercialRepository: this._perfilComercialRepository
      },
      metadata
    });

    return this._insightService.executar(insightContext);
  }

  async projetar(insightResult, contexto) {
    const insights = (insightResult.insights || []).map((item, index) => ({
      id: item.codigo || `insight-${index}`,
      codigo: item.codigo,
      categoria: item.categoria,
      prioridade: item.prioridade,
      severidade: item.severidade,
      titulo: item.titulo,
      mensagem: item.mensagem,
      dados: item.dados || {},
      origemInsight: 'shared-insight-engine',
      origemProjecao: item.dados?.origemProjecao || 'insights'
    }));

    return {
      dados: {
        insights,
        estatisticas: insightResult.estatisticas || {},
        quantidade: insightResult.quantidade ?? insights.length,
        categorias: insightResult.categorias || [],
        severidades: insightResult.severidades || [],
        warnings: insightResult.warnings || []
      },
      metadata: {
        tempoExecucao: insightResult.tempoExecucao,
        escopo: contexto.clienteId ? 'CLIENTE' : 'GLOBAL'
      }
    };
  }
}

module.exports = InsightsProjectionService;
