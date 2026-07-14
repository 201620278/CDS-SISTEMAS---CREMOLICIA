/**
 * ResilienceConfiguration — Configuração central do pipeline de resiliência.
 *
 * Sprint P-3 — Resilience Enterprise.
 *
 * @module motores/motor-comercial/bridges/resilience/ResilienceConfiguration
 */

const DEFAULTS = Object.freeze({
  maxRetries: 3,
  retryDelay: 1000,
  maxRetryDelay: 10000,
  backoffMultiplier: 2,
  timeout: 30000,
  breakerThreshold: 5,
  cooldown: 60000,
  monitoringPeriod: 10000,
  fallbackEnabled: false
});

const BRIDGE_NAMES = Object.freeze([
  'Cliente',
  'Produto',
  'Financeiro',
  'Estoque',
  'Usuario'
]);

/**
 * @param {Object} [opcoes]
 * @param {Object} [opcoes.global]
 * @param {Object} [opcoes.bridges]
 * @returns {Object}
 */
function criarResilienceConfiguration(opcoes = {}) {
  const global = { ...DEFAULTS, ...(opcoes.global ?? {}) };

  const bridges = {};
  for (const nome of BRIDGE_NAMES) {
    bridges[nome] = {
      ...global,
      ...(opcoes.bridges?.[nome] ?? {})
    };
  }

  return {
    global,
    bridges,
    getBridgeConfig(bridgeName) {
      return bridges[bridgeName] ?? { ...global };
    }
  };
}

module.exports = {
  DEFAULTS,
  BRIDGE_NAMES,
  criarResilienceConfiguration
};
