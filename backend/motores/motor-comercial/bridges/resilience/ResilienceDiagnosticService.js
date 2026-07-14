/**
 * ResilienceDiagnosticService — Observabilidade do pipeline de resiliência.
 *
 * Sprint P-3
 *
 * @module motores/motor-comercial/bridges/resilience/ResilienceDiagnosticService
 */

class ResilienceDiagnosticService {
  constructor() {
    /** @type {Object<string, Object>} */
    this._porBridge = {};
    /** @type {Object[]} */
    this._historico = [];
    this._limiteHistorico = 500;
  }

  /**
   * @private
   * @param {string} bridgeName
   * @returns {Object}
   */
  _obterOuCriar(bridgeName) {
    if (!this._porBridge[bridgeName]) {
      this._porBridge[bridgeName] = {
        bridge: bridgeName,
        totalChamadas: 0,
        sucesso: 0,
        falha: 0,
        fallback: 0,
        timeout: 0,
        circuitOpen: 0,
        tempoTotalMs: 0,
        ultimaChamada: null,
        ultimoErro: null
      };
    }
    return this._porBridge[bridgeName];
  }

  /**
   * @param {Object} entrada
   */
  registrar(entrada) {
    const bridgeName = entrada.bridge ?? 'Desconhecido';
    const stats = this._obterOuCriar(bridgeName);

    stats.totalChamadas += 1;
    stats.tempoTotalMs += Number(entrada.durationMs ?? 0);
    stats.ultimaChamada = new Date().toISOString();

    if (entrada.sucesso) {
      stats.sucesso += 1;
    } else {
      stats.falha += 1;
      stats.ultimoErro = entrada.erro ?? null;
    }

    if (entrada.fallback) stats.fallback += 1;
    if (entrada.timeout) stats.timeout += 1;
    if (entrada.circuitOpen) stats.circuitOpen += 1;

    const registro = {
      timestamp: stats.ultimaChamada,
      bridge: bridgeName,
      operacao: entrada.operacao ?? null,
      correlationId: entrada.correlationId ?? null,
      requestId: entrada.requestId ?? null,
      tentativas: entrada.tentativas ?? 1,
      durationMs: entrada.durationMs ?? 0,
      sucesso: Boolean(entrada.sucesso),
      fallback: Boolean(entrada.fallback),
      timeout: Boolean(entrada.timeout),
      circuitOpen: Boolean(entrada.circuitOpen),
      circuitState: entrada.circuitState ?? null,
      erro: entrada.erro ?? null
    };

    this._historico.unshift(registro);
    if (this._historico.length > this._limiteHistorico) {
      this._historico.length = this._limiteHistorico;
    }

    return registro;
  }

  /**
   * @returns {Object}
   */
  obterStatus() {
    const bridges = Object.values(this._porBridge);
    const totalChamadas = bridges.reduce((acc, b) => acc + b.totalChamadas, 0);
    const totalSucesso = bridges.reduce((acc, b) => acc + b.sucesso, 0);
    const totalFalha = bridges.reduce((acc, b) => acc + b.falha, 0);

    return {
      pipeline: 'ResilienceChain',
      componentes: ['RetryPolicy', 'CircuitBreaker', 'TimeoutPolicy', 'FallbackPolicy'],
      totalChamadas,
      totalSucesso,
      totalFalha,
      taxaSucesso: totalChamadas > 0 ? Number((totalSucesso / totalChamadas).toFixed(4)) : 1,
      bridgesAtivas: bridges.length
    };
  }

  /**
   * @returns {Object}
   */
  obterEstatisticas() {
    const bridges = Object.values(this._porBridge).map((stats) => ({
      ...stats,
      tempoMedioMs: stats.totalChamadas > 0
        ? Math.round(stats.tempoTotalMs / stats.totalChamadas)
        : 0
    }));

    return {
      resumo: this.obterStatus(),
      porBridge: bridges,
      historicoRecente: this._historico.slice(0, 50)
    };
  }

  /**
   * @param {Object<string, import('./ResilienceChain')>} chains
   * @returns {Object[]}
   */
  obterCircuitBreakers(chains = {}) {
    return Object.entries(chains).map(([bridge, chain]) => {
      const stats = chain?.getCircuitBreakerStats?.() ?? {};
      const bridgeStats = this._porBridge[bridge] ?? null;

      return {
        bridge,
        state: stats.state ?? 'UNKNOWN',
        failureCount: stats.failureCount ?? 0,
        successCount: stats.successCount ?? 0,
        lastFailureTime: stats.lastFailureTime ?? null,
        circuitOpenHits: bridgeStats?.circuitOpen ?? 0,
        timeout: chain?.getTimeout?.() ?? null
      };
    });
  }

  /**
   * @param {number} [limite]
   * @returns {Object[]}
   */
  obterHistorico(limite = 50) {
    return this._historico.slice(0, limite);
  }
}

module.exports = ResilienceDiagnosticService;
