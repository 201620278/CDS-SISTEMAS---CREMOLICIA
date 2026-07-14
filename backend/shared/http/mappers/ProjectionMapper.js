/**
 * ProjectionMapper — Converte resultados de Projection Services em respostas HTTP (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — mapeamento de projeções.
 *
 * @module backend/shared/http/mappers/ProjectionMapper
 */

const StandardResponse = require('../responses/StandardResponse');

class ProjectionMapper {
  /**
   * Converte resultado de Projection Service em resposta HTTP.
   * @param {Object} projectionResult - Resultado do Projection Service
   * @returns {Object}
   */
  static map(projectionResult) {
    if (!projectionResult) {
      return StandardResponse.internalError('Resultado de projeção não fornecido');
    }

    // Se o resultado tem erro
    if (projectionResult.success === false) {
      return StandardResponse.error(
        projectionResult.error?.code || 'PROJECTION_ERROR',
        projectionResult.error?.message || 'Erro na projeção',
        projectionResult.error?.details || null,
        400
      );
    }

    // Se o resultado tem dados
    if (projectionResult.dados) {
      return StandardResponse.success(
        projectionResult.dados,
        projectionResult.metadata || null,
        200
      );
    }

    // Resultado genérico
    return StandardResponse.success(projectionResult);
  }

  /**
   * Converte resultado de dashboard.
   * @param {Object} dashboardResult - Resultado do DashboardProjectionService
   * @returns {Object}
   */
  static mapDashboard(dashboardResult) {
    if (!dashboardResult) {
      return StandardResponse.internalError('Resultado de dashboard não fornecido');
    }

    return StandardResponse.success(
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
      return StandardResponse.internalError('Resultado de conta corrente não fornecido');
    }

    return StandardResponse.success(
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
      return StandardResponse.internalError('Resultado de timeline não fornecido');
    }

    return StandardResponse.success(
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
      return StandardResponse.internalError('Resultado de resumo não fornecido');
    }

    return StandardResponse.success(
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
      return StandardResponse.internalError('Resultado de indicadores não fornecido');
    }

    return StandardResponse.success(
      indicadoresResult.dados || indicadoresResult,
      indicadoresResult.metadata || null,
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
      return StandardResponse.internalError('Resultado de saldos não fornecido');
    }

    return StandardResponse.success(
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
      return StandardResponse.internalError('Resultado de histórico não fornecido');
    }

    return StandardResponse.success(
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
      return StandardResponse.internalError('Resultado de situação não fornecido');
    }

    return StandardResponse.success(
      situacaoResult.dados || situacaoResult,
      situacaoResult.metadata || null,
      200
    );
  }
}

module.exports = ProjectionMapper;
