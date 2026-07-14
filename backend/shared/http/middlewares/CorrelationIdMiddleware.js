/**
 * CorrelationIdMiddleware — Adiciona correlation ID à requisição (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — middleware aprimorado com propagação.
 *
 * @module backend/shared/http/middlewares/CorrelationIdMiddleware
 */

const { v4: uuidv4 } = require('uuid');

class CorrelationIdMiddleware {
  /**
   * Cria middleware de Correlation ID.
   * @returns {Function}
   */
  static create() {
    return (req, res, next) => {
      // Usa X-Correlation-ID do header ou gera um novo
      req.correlationId = req.headers['x-correlation-id'] || uuidv4();
      
      // Adiciona ao response para rastreamento
      res.setHeader('X-Correlation-ID', req.correlationId);
      
      // Torna disponível globalmente para propagação
      req.app.locals.correlationId = req.correlationId;
      
      next();
    };
  }
}

module.exports = CorrelationIdMiddleware;
