/**
 * Helpers para enfileiramento Outbox nos Use Cases.
 *
 * @module motores/motor-comercial/integrations/outbox/outboxUseCaseHelpers
 */

const { OUTBOX_EVENT_TYPES, OUTBOX_BRIDGE_NAMES } = require('./OutboxEventTypes');

/**
 * @param {Function|null} outboxEnqueue
 * @param {Object} evento
 * @returns {Promise<void>}
 */
async function enfileirarBridgeOutbox(outboxEnqueue, evento) {
  if (typeof outboxEnqueue !== 'function') return;
  await outboxEnqueue(evento);
}

module.exports = {
  OUTBOX_EVENT_TYPES,
  OUTBOX_BRIDGE_NAMES,
  enfileirarBridgeOutbox
};
