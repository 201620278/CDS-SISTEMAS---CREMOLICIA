/**
 * TimeoutPolicy — Política de timeout para chamadas de Bridge.
 *
 * Sprint 2.6: Bridges Oficiais — infraestrutura de resiliência.
 *
 * @module motores/motor-comercial/bridges/resilience/TimeoutPolicy
 */

class TimeoutPolicy {
  /**
   * Cria uma política de timeout.
   * @param {Object} options
   * @param {number} [options.timeout=30000] - Timeout em ms
   * @returns {TimeoutPolicy}
   */
  static create(options = {}) {
    return new TimeoutPolicy(options);
  }

  constructor(options) {
    this._timeout = options.timeout || 30000;
  }

  /**
   * Executa uma função com timeout.
   * @param {Function} fn - Função a executar
   * @returns {Promise}
   */
  async execute(fn) {
    return Promise.race([
      fn(),
      this._createTimeout()
    ]);
  }

  /**
   * Cria promise de timeout.
   * @private
   */
  _createTimeout() {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${this._timeout}ms`));
      }, this._timeout);
    });
  }

  /**
   * Define timeout.
   * @param {number} timeout - Timeout em ms
   */
  setTimeout(timeout) {
    this._timeout = timeout;
  }

  /**
   * Obtém timeout atual.
   * @returns {number}
   */
  getTimeout() {
    return this._timeout;
  }
}

module.exports = TimeoutPolicy;
