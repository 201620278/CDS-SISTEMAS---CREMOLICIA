/**
 * LoggingMiddleware — Registra logs de requisições HTTP.
 *
 * Sprint 2.5: API REST — middleware de logging.
 *
 * @module motores/motor-comercial/http/middlewares/LoggingMiddleware
 */

class LoggingMiddleware {
  /**
   * Cria middleware de logging.
   * @returns {Function}
   */
  static create() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Log da requisição
      console.log(`[${req.requestId || 'N/A'}] [${req.correlationId || 'N/A'}] ${req.method} ${req.path} - Iniciada`);

      // Intercepta o envio da resposta
      const originalSend = res.send;
      res.send = function (data) {
        const duration = Date.now() - startTime;
        console.log(`[${req.requestId || 'N/A'}] [${req.correlationId || 'N/A'}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        originalSend.call(this, data);
      };

      next();
    };
  }
}

module.exports = LoggingMiddleware;
