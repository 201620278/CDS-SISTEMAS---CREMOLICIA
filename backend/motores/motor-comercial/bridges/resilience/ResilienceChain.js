/**
 * ResilienceChain — Cadeia de políticas de resiliência para Bridges.
 *
 * Sprint 2.6: Bridges Oficiais — infraestrutura de resiliência.
 *
 * @module motores/motor-comercial/bridges/resilience/ResilienceChain
 */

const RetryPolicy = require('./RetryPolicy');
const CircuitBreaker = require('./CircuitBreaker');
const TimeoutPolicy = require('./TimeoutPolicy');
const FallbackPolicy = require('./FallbackPolicy');

class ResilienceChain {
  /**
   * Cria uma cadeia de resiliência.
   * @param {Object} options
   * @param {RetryPolicy} [options.retryPolicy] - Política de retry
   * @param {CircuitBreaker} [options.circuitBreaker] - Circuit breaker
   * @param {TimeoutPolicy} [options.timeoutPolicy] - Política de timeout
   * @param {FallbackPolicy} [options.fallbackPolicy] - Política de fallback
   * @returns {ResilienceChain}
   */
  static create(options = {}) {
    return new ResilienceChain(options);
  }

  constructor(options) {
    this._retryPolicy = options.retryPolicy || RetryPolicy.create();
    this._circuitBreaker = options.circuitBreaker || CircuitBreaker.create();
    this._timeoutPolicy = options.timeoutPolicy || TimeoutPolicy.create();
    this._fallbackPolicy = options.fallbackPolicy;
  }

  /**
   * Executa uma função com todas as políticas de resiliência.
   * @param {Function} fn - Função a executar
   * @returns {Promise}
   */
  async execute(fn) {
    const wrappedFn = this._applyPolicies(fn);
    return await wrappedFn();
  }

  /**
   * Aplica políticas de resiliência (de fora para dentro: Fallback → Retry → Circuit → Timeout → fn).
   * @private
   */
  _applyPolicies(fn) {
    const withTimeout = () => this._timeoutPolicy.execute(fn);
    const withCircuit = () => this._circuitBreaker.execute(withTimeout);
    const withRetry = () => this._retryPolicy.execute(withCircuit);

    if (this._fallbackPolicy) {
      return () => this._fallbackPolicy.execute(withRetry);
    }

    return withRetry;
  }

  /**
   * Obtém estatísticas do Circuit Breaker.
   * @returns {Object}
   */
  getCircuitBreakerStats() {
    return this._circuitBreaker.getStats();
  }

  /**
   * Reseta o Circuit Breaker.
   */
  resetCircuitBreaker() {
    this._circuitBreaker.reset();
  }

  /**
   * Define timeout.
   * @param {number} timeout - Timeout em ms
   */
  setTimeout(timeout) {
    this._timeoutPolicy.setTimeout(timeout);
  }

  /**
   * Obtém timeout atual.
   * @returns {number}
   */
  getTimeout() {
    return this._timeoutPolicy.getTimeout();
  }
}

module.exports = ResilienceChain;
