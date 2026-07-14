/**
 * ProjectionDTO — DTOs HTTP para Projection Services.
 *
 * Sprint 2.5: API REST — DTOs de projeção.
 *
 * @module motores/motor-comercial/http/dto/ProjectionDTO
 */

class DashboardResponse {
  /**
   * Converte dados de dashboard para DTO de resposta.
   * @param {Object} dashboardData
   * @returns {Object}
   */
  static toJSON(dashboardData) {
    if (!dashboardData) return null;

    return {
      cards: dashboardData.cards || [],
      kpis: dashboardData.kpis || dashboardData.indicadores || {},
      totais: dashboardData.totais || {},
      alertas: dashboardData.alertas || []
    };
  }
}

class ContaCorrenteResponse {
  /**
   * Converte dados de conta corrente para DTO de resposta.
   * @param {Object} contaCorrenteData
   * @returns {Object}
   */
  static toJSON(contaCorrenteData) {
    if (!contaCorrenteData) return null;

    return {
      clienteId: contaCorrenteData.clienteId,
      saldo: contaCorrenteData.saldo || 0,
      saldoEmAberto: contaCorrenteData.saldoEmAberto || 0,
      movimentacoes: contaCorrenteData.movimentacoes || [],
      ultimaAtualizacao: contaCorrenteData.ultimaAtualizacao || null
    };
  }
}

class TimelineResponse {
  /**
   * Converte dados de timeline para DTO de resposta.
   * @param {Object} timelineData
   * @returns {Object}
   */
  static toJSON(timelineData) {
    if (!timelineData) return null;

    return {
      eventos: timelineData.eventos || [],
      total: timelineData.total || 0,
      pagina: timelineData.pagina || 1,
      tamanhoPagina: timelineData.tamanhoPagina || 10
    };
  }
}

class ResumoPrestacaoResponse {
  /**
   * Converte dados de resumo de prestação para DTO de resposta.
   * @param {Object} resumoData
   * @returns {Object}
   */
  static toJSON(resumoData) {
    if (!resumoData) return null;

    return {
      consignacaoId: resumoData.consignacaoId,
      prestacaoId: resumoData.prestacaoId,
      status: resumoData.status,
      valorTotal: resumoData.valorTotal || 0,
      valorVendido: resumoData.valorVendido || 0,
      valorPerdido: resumoData.valorPerdido || 0,
      valorCortesia: resumoData.valorCortesia || 0,
      valorPago: resumoData.valorPago || 0,
      saldoPendente: resumoData.saldoPendente || 0,
      itens: resumoData.itens || [],
      movimentacoes: resumoData.movimentacoes || []
    };
  }
}

class SaldoResponse {
  /**
   * Converte dados de saldos para DTO de resposta.
   * @param {Object} saldoData
   * @returns {Object}
   */
  static toJSON(saldoData) {
    if (!saldoData) return null;

    return {
      clienteId: saldoData.clienteId,
      consignacaoId: saldoData.consignacaoId,
      saldoEmAberto: saldoData.saldoEmAberto || 0,
      limiteDisponivel: saldoData.limiteDisponivel || 0,
      totais: saldoData.totais || {},
      detalhes: saldoData.detalhes || []
    };
  }
}

class HistoricoResponse {
  /**
   * Converte dados de histórico para DTO de resposta.
   * @param {Object} historicoData
   * @returns {Object}
   */
  static toJSON(historicoData) {
    if (!historicoData) return null;

    return {
      clienteId: historicoData.clienteId,
      perfilComercialId: historicoData.perfilComercialId,
      registros: historicoData.registros || [],
      total: historicoData.total || 0,
      pagina: historicoData.pagina || 1,
      tamanhoPagina: historicoData.tamanhoPagina || 10
    };
  }
}

class IndicadoresResponse {
  /**
   * Converte dados de indicadores para DTO de resposta.
   * @param {Object} indicadoresData
   * @returns {Object}
   */
  static toJSON(indicadoresData) {
    if (!indicadoresData) return null;

    return {
      valorConsignado: indicadoresData.valorConsignado || 0,
      valorVendido: indicadoresData.valorVendido || 0,
      valorPerdido: indicadoresData.valorPerdido || 0,
      valorCortesia: indicadoresData.valorCortesia || 0,
      percentualVenda: indicadoresData.percentualVenda || 0,
      percentualPerda: indicadoresData.percentualPerda || 0,
      percentualCortesia: indicadoresData.percentualCortesia || 0,
      totalConsignacoes: indicadoresData.totalConsignacoes || 0,
      totalPrestacoes: indicadoresData.totalPrestacoes || 0
    };
  }
}

class SituacaoClienteResponse {
  /**
   * Converte dados de situação do cliente para DTO de resposta.
   * @param {Object} situacaoData
   * @returns {Object}
   */
  static toJSON(situacaoData) {
    if (!situacaoData) return null;

    return {
      clienteId: situacaoData.clienteId,
      situacao: situacaoData.situacao || 'DESCONHECIDA',
      score: situacaoData.score || 0,
      nivelRisco: situacaoData.nivelRisco || 'DESCONHECIDO',
      saldoEmAberto: situacaoData.saldoEmAberto || 0,
      limiteDisponivel: situacaoData.limiteDisponivel || 0,
      alertas: situacaoData.alertas || [],
      recomendacoes: situacaoData.recomendacoes || []
    };
  }
}

module.exports = {
  DashboardResponse,
  ContaCorrenteResponse,
  TimelineResponse,
  ResumoPrestacaoResponse,
  SaldoResponse,
  HistoricoResponse,
  IndicadoresResponse,
  SituacaoClienteResponse
};
