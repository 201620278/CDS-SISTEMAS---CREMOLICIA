/**
 * RequestIdMiddleware — Adiciona ID único à requisição.
 *
 * Sprint 2.5: API REST — middleware de request ID.
 *
 * @module motores/motor-comercial/http/middlewares/RequestIdMiddleware
 */

const { v4: uuidv4 } = require('uuid');

class RequestIdMiddleware {
  /**
   * Cria middleware de Request ID.
   * @returns {Function}
   */
  static create() {
    return (req, res, next) => {
      req.requestId = req.headers['x-request-id'] || uuidv4();
      res.setHeader('X-Request-ID', req.requestId);
      next();
    };
  }
}

module.exports = RequestIdMiddleware;
