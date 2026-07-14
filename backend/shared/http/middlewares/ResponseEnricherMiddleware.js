/**
 * ResponseEnricherMiddleware — Enriquece respostas com metadados da requisição.
 *
 * Sprint 2.5.5: Hardening da API — middleware de enriquecimento.
 *
 * @module backend/shared/http/middlewares/ResponseEnricherMiddleware
 */

const StandardResponse = require('../responses/StandardResponse');

class ResponseEnricherMiddleware {
  /**
   * Cria middleware de enriquecimento de resposta.
   * @returns {Function}
   */
  static create() {
    return (req, res, next) => {
      // Intercepta o método res.json
      const originalJson = res.json;
      
      res.json = function(data) {
        // Se for uma resposta padrão, enriquece com metadados
        if (data && typeof data === 'object' && (data.success !== undefined || data.error)) {
          const enriched = StandardResponse.enrich(data, req);
          return originalJson.call(this, enriched);
        }
        
        return originalJson.call(this, data);
      };
      
      next();
    };
  }
}

module.exports = ResponseEnricherMiddleware;
