/**
 * wrapBridgeWithResilience — Envolve Bridge com pipeline ResilienceChain.
 *
 * Sprint P-3
 *
 * @module motores/motor-comercial/bridges/resilience/wrapBridgeWithResilience
 */

/**
 * @param {Array} args
 * @returns {string|null}
 */
function extrairCorrelationId(args) {
  for (const arg of args) {
    if (arg && typeof arg === 'object' && arg.correlationId) {
      return arg.correlationId;
    }
  }
  return null;
}

/**
 * @param {Array} args
 * @returns {string|null}
 */
function extrairRequestId(args) {
  for (const arg of args) {
    if (arg && typeof arg === 'object' && arg.requestId) {
      return arg.requestId;
    }
  }
  return null;
}

/**
 * @param {Object} bridge
 * @param {string} bridgeName
 * @param {import('./ResilienceRegistry')} registry
 * @returns {Object}
 */
function wrapBridgeWithResilience(bridge, bridgeName, registry) {
  const executor = registry.getExecutor(bridgeName);

  return new Proxy(bridge, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value !== 'function') {
        return value;
      }

      return async (...args) => executor.execute({
        operation: String(prop),
        context: {
          correlationId: extrairCorrelationId(args),
          requestId: extrairRequestId(args)
        },
        fn: () => value.apply(target, args)
      });
    }
  });
}

module.exports = { wrapBridgeWithResilience };
