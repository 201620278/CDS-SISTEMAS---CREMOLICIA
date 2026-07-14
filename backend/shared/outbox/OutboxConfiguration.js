/**
 * OutboxConfiguration — Configuração do Outbox Pattern.
 *
 * @module backend/shared/outbox/OutboxConfiguration
 */

const DEFAULTS = Object.freeze({
  maxAttempts: 5,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  syncFallbackEnabled: true,
  processImmediatelyAfterCommit: true,
  motor: 'motor-comercial',
  tabela: 'outbox_events'
});

/**
 * @param {Object} [opcoes]
 * @returns {Object}
 */
function criarOutboxConfiguration(opcoes = {}) {
  return {
    maxAttempts: opcoes.maxAttempts ?? DEFAULTS.maxAttempts,
    initialDelayMs: opcoes.initialDelayMs ?? DEFAULTS.initialDelayMs,
    maxDelayMs: opcoes.maxDelayMs ?? DEFAULTS.maxDelayMs,
    backoffMultiplier: opcoes.backoffMultiplier ?? DEFAULTS.backoffMultiplier,
    syncFallbackEnabled: opcoes.syncFallbackEnabled !== false,
    processImmediatelyAfterCommit: opcoes.processImmediatelyAfterCommit !== false,
    motor: opcoes.motor ?? DEFAULTS.motor,
    tabela: opcoes.tabela ?? DEFAULTS.tabela,
    logger: opcoes.logger ?? console
  };
}

module.exports = {
  DEFAULTS,
  criarOutboxConfiguration
};
