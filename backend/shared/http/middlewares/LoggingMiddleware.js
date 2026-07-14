/**
 * LoggingMiddleware — Registra logs de requisições HTTP (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — logging padronizado.
 *
 * @module backend/shared/http/middlewares/LoggingMiddleware
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
      this.logRequest(req);

      // Intercepta o envio da resposta
      const originalSend = res.send;
      res.send = function (data) {
        const duration = Date.now() - startTime;
        LoggingMiddleware.logResponse(req, res, duration);
        originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Log de requisição.
   * @param {Object} req - Requisição Express
   */
  static logRequest(req) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'REQUEST',
      motor: req.app.locals.motor || 'unknown',
      requestId: req.requestId || 'N/A',
      correlationId: req.correlationId || 'N/A',
      level: 'INFO',
      message: `${req.method} ${req.path} - Iniciada`,
      context: {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent')
      }
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log de resposta.
   * @param {Object} req - Requisição Express
   * @param {Object} res - Resposta Express
   * @param {number} duration - Duração em ms
   */
  static logResponse(req, res, duration) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'RESPONSE',
      motor: req.app.locals.motor || 'unknown',
      requestId: req.requestId || 'N/A',
      correlationId: req.correlationId || 'N/A',
      level: res.statusCode >= 400 ? 'WARN' : 'INFO',
      message: `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
      context: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration
      }
    };

    console.log(JSON.stringify(logEntry));
  }
}

module.exports = LoggingMiddleware;
