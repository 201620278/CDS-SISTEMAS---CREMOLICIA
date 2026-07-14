/**
 * ErrorHandlerMiddleware — Trata erros de forma padronizada.
 *
 * Sprint 2.5: API REST — middleware de tratamento de erros.
 *
 * @module motores/motor-comercial/http/middlewares/ErrorHandlerMiddleware
 */

const HttpResponse = require('../responses/HttpResponse');
const DomainErrorMapper = require('../mappers/DomainErrorMapper');

class ErrorHandlerMiddleware {
  /**
   * Cria middleware de tratamento de erros.
   * @returns {Function}
   */
  static create() {
    return (err, req, res, next) => {
      // Log do erro
      console.error(`[${req.requestId || 'N/A'}] [${req.correlationId || 'N/A'}] Error:`, err);

      // Erro de domínio
      if (err.name && err.codigo) {
        const response = DomainErrorMapper.map(err);
        return res.status(HttpResponse.getStatusCode(response)).json(HttpResponse.sanitize(response));
      }

      // Erro de validação
      if (err.name === 'ValidationError' || err.errors) {
        const response = HttpResponse.validationError(err.message, err.errors);
        return res.status(HttpResponse.getStatusCode(response)).json(HttpResponse.sanitize(response));
      }

      // Erro genérico
      const response = HttpResponse.internalError(
        process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
        process.env.NODE_ENV !== 'production' ? { stack: err.stack } : null
      );
      return res.status(HttpResponse.getStatusCode(response)).json(HttpResponse.sanitize(response));
    };
  }
}

module.exports = ErrorHandlerMiddleware;
