/**
 * RetryPolicy — Política de retry para chamadas de Bridge.
 *
 * Sprint 2.6: Bridges Oficiais — infraestrutura de resiliência.
 *
 * @module motores/motor-comercial/bridges/resilience/RetryPolicy
 */

class RetryPolicy {
  /**
   * Cria uma política de retry.
   * @param {Object} options
   * @param {number} [options.maxRetries=3] - Máximo de tentativas
   * @param {number} [options.initialDelay=1000] - Delay inicial em ms
   * @param {number} [options.maxDelay=10000] - Delay máximo em ms
   * @param {number} [options.backoffMultiplier=2] - Multiplicador de backoff
   * @param {Function} [options.retryCondition] - Condição para retry
   * @returns {RetryPolicy}
   */
  static create(options = {}) {
    return new RetryPolicy(options);
  }

  constructor(options) {
    this._maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3;
    this._initialDelay = options.initialDelay || 1000;
    this._maxDelay = options.maxDelay || 10000;
    this._backoffMultiplier = options.backoffMultiplier || 2;
    this._retryCondition = options.retryCondition || this._defaultRetryCondition;
  }

  /**
   * Executa uma função com retry.
   * @param {Function} fn - Função a executar
   * @returns {Promise}
   */
  async execute(fn) {
    let lastError;
    let attempt = 0;

    while (attempt <= this._maxRetries) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === this._maxRetries || !this._retryCondition(error, attempt)) {
          throw error;
        }

        const delay = this._calculateDelay(attempt);
        await this._sleep(delay);
        attempt++;
      }
    }

    throw lastError;
  }

  /**
   * Calcula delay exponencial.
   * @private
   */
  _calculateDelay(attempt) {
    const delay = this._initialDelay * Math.pow(this._backoffMultiplier, attempt);
    return Math.min(delay, this._maxDelay);
  }

  /**
   * Sleep por delay especificado.
   * @private
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Condição padrão de retry.
   * @private
   */
  _defaultRetryCondition(error, attempt) {
    // Retry em erros de rede e timeout
    return error.code === 'ECONNRESET' ||
           error.code === 'ETIMEDOUT' ||
           error.code === 'ENOTFOUND' ||
           error.code === 'ECONNREFUSED' ||
           error.message.includes('timeout') ||
           error.message.includes('network');
  }
}

module.exports = RetryPolicy;
