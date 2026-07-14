/**
 * ErrorHandlerMiddleware — Trata erros de forma padronizada (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — middleware aprimorado.
 *
 * @module backend/shared/http/middlewares/ErrorHandlerMiddleware
 */

const StandardResponse = require('../responses/StandardResponse');

class ErrorHandlerMiddleware {
  /**
   * Cria middleware de tratamento de erros.
   * @returns {Function}
   */
  static create() {
    return (err, req, res, next) => {
      // Log do erro com contexto
      console.error(`[${req.requestId || 'N/A'}] [${req.correlationId || 'N/A'}] Error:`, {
        name: err.name,
        message: err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
      });

      // Erro de infraestrutura
      if (err.isInfrastructure || err.codigo === 'INFRASTRUCTURE_ERROR') {
        const response = StandardResponse.error(
          'INFRASTRUCTURE_ERROR',
          err.message,
          err.detalhes || null,
          503
        );
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      // Erro de domínio
      if (err.name && err.codigo) {
        const response = StandardResponse.domainError(err);
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      // Erro de validação
      if (err.name === 'ValidationError' || err.errors) {
        const response = StandardResponse.validationError(err.message, err.errors);
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      // Erro genérico
      const response = StandardResponse.internalError(
        process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
        process.env.NODE_ENV !== 'production' ? { stack: err.stack } : null
      );
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    };
  }
}

module.exports = ErrorHandlerMiddleware;
