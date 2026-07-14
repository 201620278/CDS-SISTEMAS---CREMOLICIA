/**
 * SecurityLog — Log padronizado de eventos de segurança.
 *
 * Sprint 2.5.5: Hardening da API — logging padronizado.
 *
 * @module backend/shared/http/logging/SecurityLog
 */

class SecurityLog {
  /**
   * Cria um log de segurança.
   * @param {Object} params
   * @param {string} params.motor - Nome do motor
   * @param {string} params.requestId - ID da requisição
   * @param {string} params.correlationId - ID de correlação
   * @param {string} params.event - Nome do evento de segurança
   * @param {string} [params.ip] - IP do cliente
   * @param {string} [params.userAgent] - User-Agent
   * @param {string} [params.usuarioId] - ID do usuário
   * @param {Object} [params.details] - Detalhes adicionais
   * @returns {Object}
   */
  static create({ motor, requestId, correlationId, event, ip, userAgent, usuarioId, details }) {
    return {
      timestamp: new Date().toISOString(),
      type: 'SECURITY',
      motor,
      requestId,
      correlationId,
      level: 'WARN',
      message: `Evento de segurança: ${event}`,
      context: {
        event,
        ip,
        userAgent,
        usuarioId,
        details
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

module.exports = SecurityLog;
