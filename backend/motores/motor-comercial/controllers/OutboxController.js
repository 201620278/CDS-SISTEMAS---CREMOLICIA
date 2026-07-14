/**
 * OutboxController — Endpoints de diagnóstico do Outbox Pattern.
 *
 * Sprint P-2 — somente leitura.
 *
 * @module motores/motor-comercial/controllers/OutboxController
 */

const { obterContainer } = require('../index');
const StandardResponse = require('../../../shared/http/responses/StandardResponse');

class OutboxController {
  /** @returns {import('../infrastructure/di/ComercialDependencyContainer')} */
  get _container() {
    return obterContainer();
  }

  /**
   * GET /outbox/status
   */
  async status(req, res, next) {
    try {
      const repository = this._container.outboxRepository;
      const processor = this._container.outboxProcessor;

      const resumo = repository
        ? await repository.obterStatus({ motor: 'motor-comercial' })
        : { motor: 'motor-comercial', total: 0, pending: 0, processing: 0, completed: 0, failed: 0, deadLetter: 0 };

      const response = StandardResponse.success({
        ...resumo,
        dispatcherDisponivel: processor ? processor.estaDisponivel() : false,
        eventTypesRegistrados: this._container.outboxDispatcher?.listarEventTypes?.() ?? []
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
   * GET /outbox/pending
   */
  async pending(req, res, next) {
    try {
      const repository = this._container.outboxRepository;
      const limite = Number(req.query.limit ?? 50);

      const eventos = repository
        ? await repository.listarPendentes({ motor: 'motor-comercial', limite })
        : [];

      const response = StandardResponse.success({
        total: eventos.length,
        eventos
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
   * GET /outbox/history
   */
  async history(req, res, next) {
    try {
      const repository = this._container.outboxRepository;
      const limite = Number(req.query.limit ?? 100);

      const eventos = repository
        ? await repository.listarHistorico({
          motor: 'motor-comercial',
          status: req.query.status ?? null,
          correlationId: req.query.correlationId ?? null,
          bridgeName: req.query.bridge ?? null,
          limite
        })
        : [];

      const response = StandardResponse.success({
        total: eventos.length,
        eventos
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

module.exports = OutboxController;
