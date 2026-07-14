/**
 * OutboxContext — Contexto de observabilidade para dispatch Outbox.
 *
 * @module backend/shared/outbox/OutboxContext
 */

/**
 * @param {Object} [dados]
 * @returns {Object}
 */
function criarOutboxContext(dados = {}) {
  return {
    correlationId: dados.correlationId ?? null,
    requestId: dados.requestId ?? null,
    motor: dados.motor ?? 'motor-comercial',
    usuarioId: dados.usuarioId ?? null,
    operacao: dados.operacao ?? null,
    metadata: dados.metadata ?? {}
  };
}

/**
 * @param {Object} evento
 * @param {Object} [extras]
 * @returns {Object}
 */
function contextoDeEvento(evento, extras = {}) {
  return criarOutboxContext({
    correlationId: evento.correlationId,
    requestId: evento.requestId ?? extras.requestId,
    motor: evento.motor,
    operacao: evento.eventType,
    metadata: {
      eventId: evento.id,
      bridgeName: evento.bridgeName,
      attempts: evento.attempts,
      ...extras.metadata
    }
  });
}

module.exports = {
  criarOutboxContext,
  contextoDeEvento
};
