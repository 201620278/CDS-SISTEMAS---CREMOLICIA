/**
 * CircuitBreaker — Circuit Breaker para chamadas de Bridge.
 *
 * Sprint 2.6: Bridges Oficiais — infraestrutura de resiliência.
 *
 * @module motores/motor-comercial/bridges/resilience/CircuitBreaker
 */

class CircuitBreaker {
  /**
   * Cria um Circuit Breaker.
   * @param {Object} options
   * @param {number} [options.failureThreshold=5] - Limite de falhas
   * @param {number} [options.resetTimeout=60000] - Timeout de reset em ms
   * @param {number} [options.monitoringPeriod=10000] - Período de monitoramento em ms
   * @returns {CircuitBreaker}
   */
  static create(options = {}) {
    return new CircuitBreaker(options);
  }

  constructor(options) {
    this._failureThreshold = options.failureThreshold || 5;
    this._resetTimeout = options.resetTimeout || 60000;
    this._monitoringPeriod = options.monitoringPeriod || 10000;

    this._state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this._failureCount = 0;
    this._lastFailureTime = null;
    this._successCount = 0;
  }

  /**
   * Executa uma função com Circuit Breaker.
   * @param {Function} fn - Função a executar
   * @returns {Promise}
   */
  async execute(fn) {
    if (this._state === 'OPEN') {
      if (this._shouldAttemptReset()) {
        this._state = 'HALF_OPEN';
        this._successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure();
      throw error;
    }
  }

  /**
   * Callback de sucesso.
   * @private
   */
  _onSuccess() {
    this._failureCount = 0;
    this._lastFailureTime = null;

    if (this._state === 'HALF_OPEN') {
      this._successCount++;
      if (this._successCount >= 3) {
        this._state = 'CLOSED';
      }
    }
  }

  /**
   * Callback de falha.
   * @private
   */
  _onFailure() {
    this._failureCount++;
    this._lastFailureTime = Date.now();

    if (this._failureCount >= this._failureThreshold) {
      this._state = 'OPEN';
    }
  }

  /**
   * Verifica se deve tentar reset.
   * @private
   */
  _shouldAttemptReset() {
    return this._lastFailureTime &&
           (Date.now() - this._lastFailureTime) >= this._resetTimeout;
  }

  /**
   * Obtém estado atual.
   * @returns {string}
   */
  getState() {
    return this._state;
  }

  /**
   * Obtém estatísticas.
   * @returns {Object}
   */
  getStats() {
    return {
      state: this._state,
      failureCount: this._failureCount,
      successCount: this._successCount,
      lastFailureTime: this._lastFailureTime
    };
  }

  /**
   * Reseta o Circuit Breaker.
   */
  reset() {
    this._state = 'CLOSED';
    this._failureCount = 0;
    this._lastFailureTime = null;
    this._successCount = 0;
  }
}

module.exports = CircuitBreaker;
