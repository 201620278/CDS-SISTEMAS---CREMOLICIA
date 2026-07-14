/**
 * OutboxProcessor — Processa eventos pendentes com retry e idempotência.
 *
 * @module backend/shared/outbox/OutboxProcessor
 */

const { OUTBOX_STATUS } = require('./OutboxEvent');
const { criarOutboxConfiguration } = require('./OutboxConfiguration');

class OutboxProcessor {
  /**
   * @param {Object} deps
   * @param {import('./OutboxRepository')} deps.repository
   * @param {import('./OutboxDispatcher')} deps.dispatcher
   * @param {Object} [deps.config]
   * @param {Object} [deps.logger]
   */
  constructor(deps) {
    if (!deps?.repository) throw new Error('OutboxProcessor: repository é obrigatório');
    if (!deps?.dispatcher) throw new Error('OutboxProcessor: dispatcher é obrigatório');

    this._repository = deps.repository;
    this._dispatcher = deps.dispatcher;
    this._config = deps.config ?? criarOutboxConfiguration();
    this._logger = deps.logger ?? this._config.logger ?? console;
    this._disponivel = true;
  }

  /**
   * @returns {boolean}
   */
  estaDisponivel() {
    return this._disponivel;
  }

  /**
   * @param {boolean} disponivel
   */
  definirDisponibilidade(disponivel) {
    this._disponivel = Boolean(disponivel);
  }

  /**
   * @param {number[]} ids
   * @returns {Promise<Object[]>}
   */
  async processarPorIds(ids = []) {
    if (!ids.length) return [];

    const eventos = await this._repository.listarPorIds(ids);
    const resultados = [];

    for (const evento of eventos) {
      resultados.push(await this._processarEvento(evento));
    }

    return resultados;
  }

  /**
   * @param {Object} [filtros]
   * @returns {Promise<Object[]>}
   */
  async processarPendentes(filtros = {}) {
    const eventos = await this._repository.listarPendentes(filtros);
    const resultados = [];

    for (const evento of eventos) {
      resultados.push(await this._processarEvento(evento));
    }

    return resultados;
  }

  /**
   * @param {Object} evento
   * @returns {Promise<Object>}
   */
  async _processarEvento(evento) {
    if (evento.status === OUTBOX_STATUS.COMPLETED) {
      return { evento, skipped: true, motivo: 'idempotente' };
    }

    if (!this._disponivel && this._config.syncFallbackEnabled) {
      return this._executarComRetry(evento);
    }

    if (!this._disponivel) {
      throw new Error('OutboxProcessor indisponível e syncFallback desabilitado');
    }

    return this._executarComRetry(evento);
  }

  /**
   * @param {Object} evento
   * @returns {Promise<Object>}
   */
  async _executarComRetry(evento) {
    let atual = evento;
    const maxTentativas = this._config.maxAttempts;

    while ((atual.attempts ?? 0) < maxTentativas) {
      if (atual.status === OUTBOX_STATUS.COMPLETED) {
        return { evento: atual, skipped: true, motivo: 'idempotente' };
      }

      atual = await this._repository.marcarProcessando(atual.id) ?? atual;

      const resultado = await this._dispatcher.dispatch(atual);

      if (resultado.isOk()) {
        const concluido = await this._repository.marcarConcluido(atual.id, {
          durationMs: resultado.meta.durationMs
        });
        return { evento: concluido, resultado: resultado.dados };
      }

      atual = await this._repository.marcarFalha(atual.id, {
        erro: resultado.erro,
        durationMs: resultado.meta.durationMs
      }) ?? atual;

      if (atual.status === OUTBOX_STATUS.DEAD_LETTER) {
        const erro = resultado.erro instanceof Error
          ? resultado.erro
          : new Error(String(resultado.erro));
        throw erro;
      }

      const delay = this._calcularBackoff(atual.attempts - 1);
      if (this._config.processImmediatelyAfterCommit) {
        await this._sleep(delay);
      } else {
        break;
      }
    }

    if (atual.status !== OUTBOX_STATUS.COMPLETED) {
      const erro = new Error(atual.lastError ?? 'Falha ao processar evento Outbox');
      throw erro;
    }

    return { evento: atual };
  }

  /**
   * @private
   * @param {number} attempt
   * @returns {number}
   */
  _calcularBackoff(attempt) {
    const delay = this._config.initialDelayMs * Math.pow(this._config.backoffMultiplier, attempt);
    return Math.min(delay, this._config.maxDelayMs);
  }

  /**
   * @private
   * @param {number} ms
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = OutboxProcessor;
