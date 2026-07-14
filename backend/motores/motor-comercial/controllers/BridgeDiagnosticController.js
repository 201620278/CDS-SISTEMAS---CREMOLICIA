/**
 * BridgeDiagnosticController — Modo diagnóstico das integrações O-13.
 *
 * @module motores/motor-comercial/controllers/BridgeDiagnosticController
 */

const { obterContainer } = require('../index');
const StandardResponse = require('../../../shared/http/responses/StandardResponse');

class BridgeDiagnosticController {
  /** @returns {import('../infrastructure/di/ComercialDependencyContainer')} */
  get _container() {
    return obterContainer();
  }

  /**
   * GET /bridges/diagnostic
   */
  async diagnostic(req, res, next) {
    try {
      const diagnostic = this._container.bridgeDiagnosticService;
      const limit = Number(req.query.limit ?? 50);

      const response = StandardResponse.success({
        modo: 'diagnostico',
        integracao: 'platform-cds-real',
        resumo: diagnostic ? diagnostic.getSummary() : { total: 0 },
        entradas: diagnostic ? diagnostic.getRecent(limit) : [],
        bridgesRegistrados: ['Cliente', 'Produto', 'Estoque', 'Financeiro', 'Usuario']
      }, {
        correlationId: req.correlationId,
        requestId: req.requestId
      });

      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /bridges/status
   */
  async status(req, res, next) {
    try {
      const container = this._container;
      const bridges = {
        cliente: Boolean(container.clienteBridge),
        produto: Boolean(container.produtoBridge),
        estoque: Boolean(container.estoqueBridge),
        financeiro: Boolean(container.financeiroBridge),
        usuario: Boolean(container.usuarioBridge)
      };

      const response = StandardResponse.success({
        status: Object.values(bridges).every(Boolean) ? 'connected' : 'partial',
        bridges,
        mock: false,
        origem: 'platform-cds'
      });

      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BridgeDiagnosticController;
