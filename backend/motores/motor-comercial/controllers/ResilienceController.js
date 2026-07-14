/**
 * ResilienceController — Endpoints de diagnóstico do pipeline de resiliência.
 *
 * Sprint P-3 — somente leitura.
 *
 * @module motores/motor-comercial/controllers/ResilienceController
 */

const { obterContainer } = require('../index');
const StandardResponse = require('../../../shared/http/responses/StandardResponse');

class ResilienceController {
  /** @returns {import('../infrastructure/di/ComercialDependencyContainer')} */
  get _container() {
    return obterContainer();
  }

  /**
   * GET /resilience/status
   */
  async status(req, res, next) {
    try {
      const registry = this._container.resilienceRegistry;
      const diagnostic = registry?.getDiagnostic?.() ?? this._container.resilienceDiagnosticService;

      const status = diagnostic
        ? diagnostic.obterStatus()
        : { pipeline: 'ResilienceChain', totalChamadas: 0 };

      const config = registry?.getConfiguration?.()?.global ?? null;

      const response = StandardResponse.success({
        ...status,
        configuracao: config,
        bridgesRegistradas: ['Cliente', 'Produto', 'Financeiro', 'Estoque', 'Usuario']
      }, {
        correlationId: req.correlationId,
        requestId: req.requestId
      });

      return res.status(StandardResponse.getStatusCode(response)).json(StandardResponse.enrich(response, req));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resilience/statistics
   */
  async statistics(req, res, next) {
    try {
      const registry = this._container.resilienceRegistry;
      const diagnostic = registry?.getDiagnostic?.() ?? this._container.resilienceDiagnosticService;
      const limite = Number(req.query.limit ?? 50);

      const estatisticas = diagnostic
        ? {
            ...diagnostic.obterEstatisticas(),
            historicoRecente: diagnostic.obterHistorico(limite)
          }
        : { resumo: { totalChamadas: 0 }, porBridge: [], historicoRecente: [] };

      const response = StandardResponse.success(estatisticas, {
        correlationId: req.correlationId,
        requestId: req.requestId
      });

      return res.status(StandardResponse.getStatusCode(response)).json(StandardResponse.enrich(response, req));
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /resilience/circuit-breakers
   */
  async circuitBreakers(req, res, next) {
    try {
      const registry = this._container.resilienceRegistry;
      const diagnostic = registry?.getDiagnostic?.() ?? this._container.resilienceDiagnosticService;

      const circuitBreakers = registry && diagnostic
        ? diagnostic.obterCircuitBreakers(registry.getAllChains())
        : [];

      const response = StandardResponse.success({
        total: circuitBreakers.length,
        circuitBreakers
      }, {
        correlationId: req.correlationId,
        requestId: req.requestId
      });

      return res.status(StandardResponse.getStatusCode(response)).json(StandardResponse.enrich(response, req));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ResilienceController;
