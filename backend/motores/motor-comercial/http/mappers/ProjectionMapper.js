/**
 * ProjectionMapper — Converte resultados de Projection Services em respostas HTTP.
 *
 * Sprint 2.5: API REST — mapeamento de projeções.
 *
 * @module motores/motor-comercial/http/mappers/ProjectionMapper
 */

const HttpResponse = require('../responses/HttpResponse');

class ProjectionMapper {
  /**
   * Converte resultado de Projection Service em resposta HTTP.
   * @param {Object} projectionResult - Resultado do Projection Service
   * @returns {Object}
   */
  static map(projectionResult) {
    if (!projectionResult) {
      return HttpResponse.internalError('Resultado de projeção não fornecido');
    }

    // Se o resultado tem erro
    if (projectionResult.success === false) {
      return HttpResponse.error(
        projectionResult.error?.code || 'PROJECTION_ERROR',
        projectionResult.error?.message || 'Erro na projeção',
        projectionResult.error?.details || null,
        400
      );
    }

    // Se o resultado tem dados
    if (projectionResult.dados) {
      return HttpResponse.success(
        projectionResult.dados,
        projectionResult.metadata || null,
        200
      );
    }

    // Resultado genérico
    return HttpResponse.success(projectionResult);
  }

  /**
   * Converte resultado de dashboard.
   * @param {Object} dashboardResult - Resultado do DashboardProjectionService
   * @returns {Object}
   */
  static mapDashboard(dashboardResult) {
    if (!dashboardResult) {
      return HttpResponse.internalError('Resultado de dashboard não fornecido');
    }

    return HttpResponse.success(
      {
        cards: dashboardResult.cards || [],
        kpis: dashboardResult.indicadores || {},
        totais: dashboardResult.totais || {},
        alertas: dashboardResult.alertas || []
      },
      dashboardResult.metadata || { escopo: 'GLOBAL' },
      200
    );
  }

  /**
   * Converte resultado de conta corrente.
   * @param {Object} contaCorrenteResult - Resultado do ContaCorrenteProjectionService
   * @returns {Object}
   */
  static mapContaCorrente(contaCorrenteResult) {
    if (!contaCorrenteResult) {
      return HttpResponse.internalError('Resultado de conta corrente não fornecido');
    }

    return HttpResponse.success(
      contaCorrenteResult.dados || contaCorrenteResult,
      contaCorrenteResult.metadata || null,
      200
    );
  }

  /**
   * Converte resultado de timeline.
   * @param {Object} timelineResult - Resultado do TimelineProjectionService
   * @returns {Object}
   */
  static mapTimeline(timelineResult) {
    if (!timelineResult) {
      return HttpResponse.internalError('Resultado de timeline não fornecido');
    }

    return HttpResponse.success(
      timelineResult.dados || timelineResult,
      timelineResult.metadata || null,
      200
    );
  }

  /**
   * Converte resultado de resumo de prestação.
   * @param {Object} resumoResult - Resultado do ResumoPrestacaoProjectionService
   * @returns {Object}
   */
  static mapResumoPrestacao(resumoResult) {
    if (!resumoResult) {
      return HttpResponse.internalError('Resultado de resumo não fornecido');
    }

    return HttpResponse.success(
      resumoResult.dados || resumoResult,
      resumoResult.metadata || null,
      200
    );
  }

  /**
   * Converte resultado de indicadores.
   * @param {Object} indicadoresResult - Resultado do IndicadoresProjectionService
   * @returns {Object}
   */
  static mapIndicadores(indicadoresResult) {
    if (!indicadoresResult) {
      return HttpResponse.internalError('Resultado de indicadores não fornecido');
    }

    return HttpResponse.success(
      indicadoresResult.dados || indicadoresResult,
      indicadoresResult.metadata || null,
      200
    );
  }

  /**
   * Converte resultado de insights.
   * @param {Object} insightsResult - Resultado do IndicadoresProjectionService usado para insights
   * @returns {Object}
   */
  static mapInsights(insightsResult) {
    if (!insightsResult) {
      return HttpResponse.internalError('Resultado de insights não fornecido');
    }

    const dados = insightsResult.dados || insightsResult;
    return HttpResponse.success(
      dados,
      insightsResult.metadata || null,
      200
    );
  }

  /**
   * Converte resultado de pendências.
   * @param {Object} pendenciasResult
   * @returns {Object}
   */
  static mapPendencias(pendenciasResult) {
    if (!pendenciasResult) {
      return HttpResponse.internalError('Resultado de pendências não fornecido');
    }

    return HttpResponse.success(
      pendenciasResult.dados || pendenciasResult,
      pendenciasResult.metadata || null,
      200
    );
  }

  /**
   * Converte resultado de recomendações.
   * @param {Object} recomendacoesResult
   * @returns {Object}
   */
  static mapRecomendacoes(recomendacoesResult) {
    if (!recomendacoesResult) {
      return HttpResponse.internalError('Resultado de recomendações não fornecido');
    }

    return HttpResponse.success(
      recomendacoesResult.dados || recomendacoesResult,
      recomendacoesResult.metadata || null,
      200
    );
  }

  static mapPlaybooks(playbooksResult) {
    if (!playbooksResult) {
      return HttpResponse.internalError('Resultado de playbooks não fornecido');
    }

    return HttpResponse.success(
      playbooksResult.dados || playbooksResult,
      playbooksResult.metadata || null,
      200
    );
  }

  static mapWorkflow(workflowResult) {
    if (!workflowResult) {
      return HttpResponse.internalError('Resultado de workflow não fornecido');
    }

    return HttpResponse.success(
      workflowResult.dados || workflowResult,
      workflowResult.metadata || null,
      200
    );
  }

  /**
   * Converte resultado de saldos.
   * @param {Object} saldosResult - Resultado do SaldoProjectionService
   * @returns {Object}
   */
  static mapSaldos(saldosResult) {
    if (!saldosResult) {
      return HttpResponse.internalError('Resultado de saldos não fornecido');
    }

    return HttpResponse.success(
      saldosResult.dados || saldosResult,
      saldosResult.metadata || null,
      200
    );
  }

  /**
   * Converte resultado de histórico.
   * @param {Object} historicoResult - Resultado do HistoricoProjectionService
   * @returns {Object}
   */
  static mapHistorico(historicoResult) {
    if (!historicoResult) {
      return HttpResponse.internalError('Resultado de histórico não fornecido');
    }

    return HttpResponse.success(
      historicoResult.dados || historicoResult,
      historicoResult.metadata || null,
      200
    );
  }

  /**
   * Converte resultado de situação do cliente.
   * @param {Object} situacaoResult - Resultado do SituacaoClienteProjectionService
   * @returns {Object}
   */
  static mapSituacaoCliente(situacaoResult) {
    if (!situacaoResult) {
      return HttpResponse.internalError('Resultado de situação não fornecido');
    }

    return HttpResponse.success(
      situacaoResult.dados || situacaoResult,
      situacaoResult.metadata || null,
      200
    );
  }
}

module.exports = ProjectionMapper;
