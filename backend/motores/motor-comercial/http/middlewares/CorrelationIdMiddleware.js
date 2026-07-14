/**
 * CorrelationIdMiddleware — Adiciona correlation ID à requisição.
 *
 * Sprint 2.5: API REST — middleware de correlation ID.
 *
 * @module motores/motor-comercial/http/middlewares/CorrelationIdMiddleware
 */

const { v4: uuidv4 } = require('uuid');

class CorrelationIdMiddleware {
  /**
   * Cria middleware de Correlation ID.
   * @returns {Function}
   */
  static create() {
    return (req, res, next) => {
      req.correlationId = req.headers['x-correlation-id'] || uuidv4();
      res.setHeader('X-Correlation-ID', req.correlationId);
      next();
    };
  }
}

module.exports = CorrelationIdMiddleware;
