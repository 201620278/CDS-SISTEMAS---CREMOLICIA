/**
 * ErrorLog — Log padronizado de erros.
 *
 * Sprint 2.5.5: Hardening da API — logging padronizado.
 *
 * @module backend/shared/http/logging/ErrorLog
 */

class ErrorLog {
  /**
   * Cria um log de erro.
   * @param {Object} params
   * @param {string} params.motor - Nome do motor
   * @param {string} params.requestId - ID da requisição
   * @param {string} params.correlationId - ID de correlação
   * @param {string} params.error - Nome do erro
   * @param {string} params.message - Mensagem de erro
   * @param {Object} [params.stack] - Stack trace
   * @param {Object} [params.context] - Contexto adicional
   * @returns {Object}
   */
  static create({ motor, requestId, correlationId, error, message, stack, context }) {
    return {
      timestamp: new Date().toISOString(),
      type: 'ERROR',
      motor,
      requestId,
      correlationId,
      level: 'ERROR',
      message: `Erro: ${message}`,
      context: {
        error,
        message,
        stack: process.env.NODE_ENV !== 'production' ? stack : undefined,
        context
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
    console.error(this.toJSON(logEntry));
  }
}

module.exports = ErrorLog;
