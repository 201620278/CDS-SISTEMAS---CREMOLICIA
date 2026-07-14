/**
 * PerformanceLog — Log padronizado de métricas de performance.
 *
 * Sprint 2.5.5: Hardening da API — logging padronizado.
 *
 * @module backend/shared/http/logging/PerformanceLog
 */

class PerformanceLog {
  /**
   * Cria um log de performance.
   * @param {Object} params
   * @param {string} params.motor - Nome do motor
   * @param {string} params.requestId - ID da requisição
   * @param {string} params.correlationId - ID de correlação
   * @param {string} params.operation - Nome da operação
   * @param {number} params.duration - Duração em ms
   * @param {Object} [params.metadata] - Metadados adicionais
   * @returns {Object}
   */
  static create({ motor, requestId, correlationId, operation, duration, metadata }) {
    return {
      timestamp: new Date().toISOString(),
      type: 'PERFORMANCE',
      motor,
      requestId,
      correlationId,
      level: 'INFO',
      message: `Performance: ${operation} - ${duration}ms`,
      context: {
        operation,
        duration,
        metadata
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

module.exports = PerformanceLog;
