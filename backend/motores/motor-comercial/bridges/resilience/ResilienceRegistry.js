/**
 * ResilienceRegistry — Registro central de chains e executors por Bridge.
 *
 * Sprint P-3
 *
 * @module motores/motor-comercial/bridges/resilience/ResilienceRegistry
 */

const RetryPolicy = require('./RetryPolicy');
const CircuitBreaker = require('./CircuitBreaker');
const TimeoutPolicy = require('./TimeoutPolicy');
const FallbackPolicy = require('./FallbackPolicy');
const ResilienceChain = require('./ResilienceChain');
const ResilienceBridgeExecutor = require('./ResilienceBridgeExecutor');
const ResilienceDiagnosticService = require('./ResilienceDiagnosticService');
const { criarResilienceConfiguration, BRIDGE_NAMES } = require('./ResilienceConfiguration');

/**
 * Fallback padrão — retorna envelope sem alterar contratos de domínio.
 *
 * @param {string} bridgeName
 * @param {string} operation
 * @param {Error} error
 * @returns {Object}
 */
function criarFallbackPadrao(bridgeName, operation, error) {
  return {
    _resilienceFallback: true,
    bridge: bridgeName,
    operation,
    motivo: error?.message ?? 'Falha na integração externa',
    deferred: true
  };
}

class ResilienceRegistry {
  /**
   * @param {Object} [deps]
   * @param {Object} [deps.config]
   * @param {import('./ResilienceDiagnosticService')} [deps.diagnostic]
   * @param {Function} [deps.fallbackFactory]
   */
  constructor(deps = {}) {
    this._config = deps.config ?? criarResilienceConfiguration();
    this._diagnostic = deps.diagnostic ?? new ResilienceDiagnosticService();
    this._fallbackFactory = deps.fallbackFactory ?? criarFallbackPadrao;
    /** @type {Map<string, import('./ResilienceChain')>} */
    this._chains = new Map();
    /** @type {Map<string, ResilienceBridgeExecutor>} */
    this._executors = new Map();

    for (const bridgeName of BRIDGE_NAMES) {
      this._registrarBridge(bridgeName);
    }
  }

  /**
   * @private
   * @param {string} bridgeName
   */
  _registrarBridge(bridgeName) {
    const bridgeConfig = this._config.getBridgeConfig(bridgeName);

    const retryPolicy = RetryPolicy.create({
      maxRetries: bridgeConfig.maxRetries,
      initialDelay: bridgeConfig.retryDelay,
      maxDelay: bridgeConfig.maxRetryDelay,
      backoffMultiplier: bridgeConfig.backoffMultiplier
    });

    const circuitBreaker = CircuitBreaker.create({
      failureThreshold: bridgeConfig.breakerThreshold,
      resetTimeout: bridgeConfig.cooldown,
      monitoringPeriod: bridgeConfig.monitoringPeriod
    });

    const timeoutPolicy = TimeoutPolicy.create({
      timeout: bridgeConfig.timeout
    });

    let fallbackPolicy = null;
    if (bridgeConfig.fallbackEnabled) {
      fallbackPolicy = FallbackPolicy.create({
        fallbackFn: (error) => this._fallbackFactory(bridgeName, 'unknown', error)
      });
    }

    const chain = ResilienceChain.create({
      retryPolicy,
      circuitBreaker,
      timeoutPolicy,
      fallbackPolicy
    });

    const executor = new ResilienceBridgeExecutor({
      bridgeName,
      chain,
      diagnostic: this._diagnostic
    });

    this._chains.set(bridgeName, chain);
    this._executors.set(bridgeName, executor);
  }

  /**
   * @param {string} bridgeName
   * @returns {ResilienceBridgeExecutor}
   */
  getExecutor(bridgeName) {
    const executor = this._executors.get(bridgeName);
    if (!executor) {
      throw new Error(`ResilienceRegistry: bridge não registrada — ${bridgeName}`);
    }
    return executor;
  }

  /**
   * @param {string} bridgeName
   * @returns {import('./ResilienceChain')}
   */
  getChain(bridgeName) {
    return this._chains.get(bridgeName);
  }

  /**
   * @returns {Object<string, import('./ResilienceChain')>}
   */
  getAllChains() {
    return Object.fromEntries(this._chains.entries());
  }

  /**
   * @returns {import('./ResilienceDiagnosticService')}
   */
  getDiagnostic() {
    return this._diagnostic;
  }

  /**
   * @returns {Object}
   */
  getConfiguration() {
    return this._config;
  }
}

/**
 * @param {Object} [opcoes]
 * @returns {ResilienceRegistry}
 */
function criarResilienceRegistry(opcoes = {}) {
  return new ResilienceRegistry(opcoes);
}

module.exports = {
  ResilienceRegistry,
  criarResilienceRegistry,
  criarFallbackPadrao
};
