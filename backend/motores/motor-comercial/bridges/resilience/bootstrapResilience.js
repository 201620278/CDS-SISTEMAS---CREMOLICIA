/**
 * Bootstrap Resilience — Sprint P-3.
 *
 * @module motores/motor-comercial/bridges/resilience/bootstrapResilience
 */

const { criarResilienceRegistry } = require('./ResilienceRegistry');
const { criarResilienceConfiguration } = require('./ResilienceConfiguration');

/**
 * @param {Object} [opcoes]
 * @returns {import('./ResilienceRegistry')}
 */
function bootstrapResilience(opcoes = {}) {
  const config = criarResilienceConfiguration(opcoes.config ?? {});
  return criarResilienceRegistry({
    config,
    diagnostic: opcoes.diagnostic ?? null,
    fallbackFactory: opcoes.fallbackFactory ?? null
  });
}

module.exports = { bootstrapResilience };
