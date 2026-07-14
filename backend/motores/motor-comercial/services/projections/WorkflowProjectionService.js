/**
 * WorkflowProjectionService — Central de Workflow Operacional.
 *
 * Sprint O-11: deriva filas operacionais de Pendências + Recomendações + Playbooks.
 *
 * @class WorkflowProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const WorkflowDTO = require('../../dto/WorkflowDTO');

class WorkflowProjectionService extends BaseProjectionService {
  constructor(deps = {}) {
    super(deps);
    this._pendenciasService = deps.pendenciasService ?? null;
    this._recomendacoesService = deps.recomendacoesService ?? null;
    this._playbooksService = deps.playbooksService ?? null;
    this._workflowService = deps.workflowService ?? null;
  }

  async validar(_contexto) {
    if (!this._workflowService || !this._pendenciasService || !this._recomendacoesService || !this._playbooksService) {
      throw new Error('Serviços de workflow não configurados');
    }
  }

  async consultar(contexto) {
    const ctx = contexto.toJSON ? contexto.toJSON() : contexto;
    const [pendenciasResult, recomendacoesResult, playbooksResult] = await Promise.all([
      this._pendenciasService.executar(ctx),
      this._recomendacoesService.executar(ctx),
      this._playbooksService.executar(ctx)
    ]);
    return { pendenciasResult, recomendacoesResult, playbooksResult, ctx };
  }

  async projetar({ pendenciasResult, recomendacoesResult, playbooksResult, ctx }, _contexto) {
    const pendencias = pendenciasResult.dados || pendenciasResult;
    const recomendacoes = recomendacoesResult.dados || recomendacoesResult;
    const playbooks = playbooksResult.dados || playbooksResult;

    const resultado = this._workflowService.executar({
      pendencias,
      recomendacoes,
      playbooks,
      clienteId: ctx.clienteId
    });

    const dto = WorkflowDTO.create(resultado);
    return {
      dados: dto.toJSON(),
      metadata: {
        escopo: ctx.clienteId ? 'CLIENTE' : 'GLOBAL',
        origem: ['pendencias', 'recomendacoes', 'playbooks', 'workflow-service'],
        geradoEm: new Date().toISOString()
      }
    };
  }
}

module.exports = WorkflowProjectionService;
