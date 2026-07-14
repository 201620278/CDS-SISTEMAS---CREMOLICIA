/**
 * ResilienceBridgeExecutor — Executa chamadas de Bridge via ResilienceChain.
 *
 * Sprint P-3
 *
 * @module motores/motor-comercial/bridges/resilience/ResilienceBridgeExecutor
 */

/**
 * @param {Object} deps
 * @param {string} deps.bridgeName
 * @param {import('./ResilienceChain')} deps.chain
 * @param {import('./ResilienceDiagnosticService')} deps.diagnostic
 */
class ResilienceBridgeExecutor {
  constructor(deps) {
    this._bridgeName = deps.bridgeName;
    this._chain = deps.chain;
    this._diagnostic = deps.diagnostic;
  }

  /**
   * @param {Object} params
   * @param {string} params.operation
   * @param {Function} params.fn
   * @param {Object} [params.context]
   * @returns {Promise<*>}
   */
  async execute({ operation, fn, context = {} }) {
    const inicio = Date.now();
    let tentativas = 0;

    try {
      const resultado = await this._chain.execute(async () => {
        tentativas += 1;
        return fn();
      });

      this._diagnostic.registrar({
        bridge: this._bridgeName,
        operacao: operation,
        correlationId: context.correlationId ?? null,
        requestId: context.requestId ?? null,
        tentativas,
        durationMs: Date.now() - inicio,
        sucesso: true,
        fallback: Boolean(resultado?._resilienceFallback),
        timeout: false,
        circuitOpen: false,
        circuitState: this._chain.getCircuitBreakerStats().state
      });

      return resultado;
    } catch (erro) {
      const mensagem = erro?.message ?? String(erro);
      const circuitOpen = mensagem.includes('Circuit breaker is OPEN');
      const timeout = mensagem.includes('timed out');

      this._diagnostic.registrar({
        bridge: this._bridgeName,
        operacao: operation,
        correlationId: context.correlationId ?? null,
        requestId: context.requestId ?? null,
        tentativas,
        durationMs: Date.now() - inicio,
        sucesso: false,
        fallback: false,
        timeout,
        circuitOpen,
        circuitState: this._chain.getCircuitBreakerStats().state,
        erro: mensagem
      });

      throw erro;
    }
  }

  /**
   * @returns {import('./ResilienceChain')}
   */
  getChain() {
    return this._chain;
  }
}

module.exports = ResilienceBridgeExecutor;
