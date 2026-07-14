/**
 * OutboxService — Fachada para enfileirar e processar eventos Outbox.
 *
 * @module backend/shared/outbox/OutboxService
 */

const OutboxRepository = require('./OutboxRepository');

class OutboxService {
  /**
   * @param {Object} deps
   * @param {import('./OutboxRepository')} deps.repository
   * @param {import('./OutboxProcessor')} deps.processor
   * @param {Object} [deps.config]
   * @param {Function} [deps.criarRepository]
   */
  constructor(deps) {
    this._repository = deps.repository;
    this._processor = deps.processor;
    this._config = deps.config ?? {};
    this._criarRepository = deps.criarRepository
      ?? ((db) => new OutboxRepository({ db, config: this._config }));
  }

  /**
   * Enfileira evento dentro da transação (usa db transacional do UoW).
   *
   * @param {Object} uow
   * @param {Object} evento
   * @returns {Promise<Object>}
   */
  async enfileirar(uow, evento) {
    const db = typeof uow?.obterDbTransacional === 'function'
      ? uow.obterDbTransacional()
      : null;

    const repo = db && typeof db.run === 'function'
      ? this._criarRepository(db)
      : this._repository;

    return repo.inserir(evento);
  }

  /**
   * Processa eventos após commit.
   *
   * @param {number[]} ids
   * @returns {Promise<Object[]>}
   */
  async processarAposCommit(ids = []) {
    if (!ids.length) return [];
    if (!this._config.processImmediatelyAfterCommit) return [];

    return this._processor.processarPorIds(ids);
  }

  /**
   * @returns {import('./OutboxRepository')}
   */
  get repository() {
    return this._repository;
  }

  /**
   * @returns {import('./OutboxProcessor')}
   */
  get processor() {
    return this._processor;
  }
}

module.exports = OutboxService;
