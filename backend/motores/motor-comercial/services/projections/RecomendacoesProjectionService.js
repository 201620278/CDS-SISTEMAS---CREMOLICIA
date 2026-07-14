/**
 * RecomendacoesProjectionService — expõe recomendações via projeção.
 *
 * Sprint O-9: Insights → RecommendationService → API.
 *
 * @class RecomendacoesProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const RecomendacoesDTO = require('../../dto/RecomendacoesDTO');

class RecomendacoesProjectionService extends BaseProjectionService {
  constructor(deps = {}) {
    super(deps);
    this._insightsService = deps.insightsService ?? null;
    this._pendenciasService = deps.pendenciasService ?? null;
    this._indicadoresService = deps.indicadoresService ?? null;
    this._situacaoClienteService = deps.situacaoClienteService ?? null;
    this._recommendationService = deps.recommendationService ?? null;
  }

  async validar(_contexto) {
    if (!this._insightsService || !this._recommendationService) {
      throw new Error('Serviços de recomendação não configurados');
    }
  }

  async consultar(contexto) {
    const ctx = contexto.toJSON ? contexto.toJSON() : contexto;
    const requests = [
      this._insightsService.executar(ctx),
      this._pendenciasService.executar(ctx),
      this._indicadoresService.executar(ctx)
    ];

    if (ctx.clienteId) {
      requests.push(this._situacaoClienteService.executar({ clienteId: ctx.clienteId }));
    }

    const [insightsResult, pendenciasResult, indicadoresResult, situacaoResult] = await Promise.all(requests);

    return { insightsResult, pendenciasResult, indicadoresResult, situacaoResult, ctx };
  }

  async projetar({ insightsResult, pendenciasResult, indicadoresResult, situacaoResult, ctx }, _contexto) {
    const insightsData = insightsResult.dados || insightsResult;
    const pendenciasData = pendenciasResult.dados || pendenciasResult;

    const insights = insightsData.insights || [];
    const alertas = pendenciasData.alertas || [];

    const resultado = this._recommendationService.executar({
      insights,
      alertas,
      indicadores: indicadoresResult,
      situacao: situacaoResult,
      clienteId: ctx.clienteId
    });

    const dto = RecomendacoesDTO.create(resultado);

    return {
      dados: dto.toJSON(),
      metadata: {
        escopo: ctx.clienteId ? 'CLIENTE' : 'GLOBAL',
        origem: ['insights', 'pendencias', 'recommendation-engine'],
        geradoEm: new Date().toISOString()
      }
    };
  }
}

module.exports = RecomendacoesProjectionService;
