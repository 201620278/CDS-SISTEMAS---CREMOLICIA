/**
 * FallbackPolicy — Política de fallback para chamadas de Bridge.
 *
 * Sprint 2.6: Bridges Oficiais — infraestrutura de resiliência.
 *
 * @module motores/motor-comercial/bridges/resilience/FallbackPolicy
 */

class FallbackPolicy {
  /**
   * Cria uma política de fallback.
   * @param {Object} options
   * @param {Function} options.fallbackFn - Função de fallback
   * @param {Function} [options.condition] - Condição para executar fallback
   * @returns {FallbackPolicy}
   */
  static create(options) {
    return new FallbackPolicy(options);
  }

  constructor(options) {
    this._fallbackFn = options.fallbackFn;
    this._condition = options.condition || this._defaultCondition;
  }

  /**
   * Executa uma função com fallback.
   * @param {Function} fn - Função principal
   * @returns {Promise}
   */
  async execute(fn) {
    try {
      return await fn();
    } catch (error) {
      if (this._condition(error)) {
        return await this._fallbackFn(error);
      }
      throw error;
    }
  }

  /**
   * Condição padrão para fallback.
   * @private
   */
  _defaultCondition(error) {
    // Fallback em todos os erros
    return true;
  }
}

module.exports = FallbackPolicy;
