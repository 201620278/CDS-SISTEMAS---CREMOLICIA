/**
 * Envolve um gateway de plataforma com telemetria diagnóstica.
 *
 * @module motores/motor-comercial/bridges/platform/wrapWithDiagnostic
 */

/**
 * @param {string} bridgeName
 * @param {Object} gateway
 * @param {import('../diagnostic/BridgeDiagnosticService')} diagnostic
 * @returns {Object}
 */
function wrapWithDiagnostic(bridgeName, gateway, diagnostic) {
  return new Proxy(gateway, {
    get(target, prop) {
      const value = target[prop];
      if (typeof value !== 'function') {
        return value;
      }

      return async (...args) => {
        const start = Date.now();
        const correlationId = extrairCorrelationId(args);

        try {
          const result = await value.apply(target, args);
          diagnostic.record({
            bridge: bridgeName,
            method: String(prop),
            status: 'OK',
            durationMs: Date.now() - start,
            correlationId,
            fallback: false
          });
          return result;
        } catch (error) {
          diagnostic.record({
            bridge: bridgeName,
            method: String(prop),
            status: 'ERROR',
            durationMs: Date.now() - start,
            correlationId,
            error: error.message,
            fallback: false
          });
          throw error;
        }
      };
    }
  });
}

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

module.exports = { wrapWithDiagnostic };
