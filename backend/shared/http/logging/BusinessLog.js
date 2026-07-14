/**
 * BusinessLog — Log padronizado de eventos de negócio.
 *
 * Sprint 2.5.5: Hardening da API — logging padronizado.
 *
 * @module backend/shared/http/logging/BusinessLog
 */

class BusinessLog {
  /**
   * Cria um log de negócio.
   * @param {Object} params
   * @param {string} params.motor - Nome do motor
   * @param {string} params.requestId - ID da requisição
   * @param {string} params.correlationId - ID de correlação
   * @param {string} params.event - Nome do evento
   * @param {string} [params.entity] - Entidade envolvida
   * @param {string} [params.entityId] - ID da entidade
   * @param {Object} [params.data] - Dados adicionais
   * @param {string} [params.usuarioId] - ID do usuário
   * @returns {Object}
   */
  static create({ motor, requestId, correlationId, event, entity, entityId, data, usuarioId }) {
    return {
      timestamp: new Date().toISOString(),
      type: 'BUSINESS',
      motor,
      requestId,
      correlationId,
      level: 'INFO',
      message: `Evento de negócio: ${event}`,
      context: {
        event,
        entity,
        entityId,
        usuarioId,
        data
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

module.exports = BusinessLog;
