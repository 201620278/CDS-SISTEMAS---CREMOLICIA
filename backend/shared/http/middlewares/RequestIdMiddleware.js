/**
 * RequestIdMiddleware — Adiciona ID único à requisição (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — middleware aprimorado.
 *
 * @module backend/shared/http/middlewares/RequestIdMiddleware
 */

const { v4: uuidv4 } = require('uuid');

class RequestIdMiddleware {
  /**
   * Cria middleware de Request ID.
   * @returns {Function}
   */
  static create() {
    return (req, res, next) => {
      // Usa X-Request-ID do header ou gera um novo
      req.requestId = req.headers['x-request-id'] || uuidv4();
      
      // Adiciona ao response para rastreamento
      res.setHeader('X-Request-ID', req.requestId);
      
      next();
    };
  }
}

module.exports = RequestIdMiddleware;
