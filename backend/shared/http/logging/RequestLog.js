/**
 * RequestLog — Log padronizado de requisições HTTP.
 *
 * Sprint 2.5.5: Hardening da API — logging padronizado.
 *
 * @module backend/shared/http/logging/RequestLog
 */

class RequestLog {
  /**
   * Cria um log de requisição.
   * @param {Object} params
   * @param {string} params.motor - Nome do motor
   * @param {string} params.requestId - ID da requisição
   * @param {string} params.correlationId - ID de correlação
   * @param {string} params.method - Método HTTP
   * @param {string} params.path - Caminho da requisição
   * @param {Object} [params.query] - Query parameters
   * @param {string} [params.ip] - IP do cliente
   * @param {string} [params.userAgent] - User-Agent
   * @returns {Object}
   */
  static create({ motor, requestId, correlationId, method, path, query, ip, userAgent }) {
    return {
      timestamp: new Date().toISOString(),
      type: 'REQUEST',
      motor,
      requestId,
      correlationId,
      level: 'INFO',
      message: `${method} ${path} - Iniciada`,
      context: {
        method,
        path,
        query,
        ip,
        userAgent
      }
    };
  }

  /**
   * Converte para string JSON.
   * @param {Object} logEntry - Entrada de log
   * @returns {string}
   */
  static toJSON(logEntry) {
    return JSON.stringify(logEntry);
  }

  /**
   * Registra o log no console.
   * @param {Object} logEntry - Entrada de log
   */
  static log(logEntry) {
    console.log(this.toJSON(logEntry));
  }
}

module.exports = RequestLog;
