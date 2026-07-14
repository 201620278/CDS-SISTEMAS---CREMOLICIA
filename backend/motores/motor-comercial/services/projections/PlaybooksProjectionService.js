/**
 * PlaybooksProjectionService — Central de Playbooks Operacionais.
 *
 * Sprint O-10.
 *
 * @class PlaybooksProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const PlaybooksDTO = require('../../dto/PlaybooksDTO');

class PlaybooksProjectionService extends BaseProjectionService {
  constructor(deps = {}) {
    super(deps);
    this._recomendacoesService = deps.recomendacoesService ?? null;
    this._insightsService = deps.insightsService ?? null;
    this._pendenciasService = deps.pendenciasService ?? null;
    this._playbookService = deps.playbookService ?? null;
  }

  async validar(_contexto) {
    if (!this._playbookService || !this._recomendacoesService) {
      throw new Error('Serviços de playbooks não configurados');
    }
  }

  async consultar(contexto) {
    const ctx = contexto.toJSON ? contexto.toJSON() : contexto;
    const [recomendacoesResult, insightsResult, pendenciasResult] = await Promise.all([
      this._recomendacoesService.executar(ctx),
      this._insightsService.executar(ctx),
      this._pendenciasService.executar(ctx)
    ]);
    return { recomendacoesResult, insightsResult, pendenciasResult, ctx };
  }

  async projetar({ recomendacoesResult, insightsResult, pendenciasResult, ctx }, _contexto) {
    const recData = recomendacoesResult.dados || recomendacoesResult;
    const insData = insightsResult.dados || insightsResult;
    const pendData = pendenciasResult.dados || pendenciasResult;

    const resultado = this._playbookService.executar({
      recomendacoes: recData.recomendacoes || [],
      insights: insData.insights || [],
      alertas: pendData.alertas || [],
      clienteId: ctx.clienteId
    });

    const dto = PlaybooksDTO.create(resultado);
    return {
      dados: dto.toJSON(),
      metadata: {
        escopo: ctx.clienteId ? 'CLIENTE' : 'GLOBAL',
        origem: ['recommendation-engine', 'insights', 'playbook-catalog'],
        geradoEm: new Date().toISOString()
      }
    };
  }
}

module.exports = PlaybooksProjectionService;
