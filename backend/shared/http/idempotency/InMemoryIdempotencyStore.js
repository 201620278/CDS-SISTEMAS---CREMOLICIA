/**
 * InMemoryIdempotencyStore — Implementação em memória do IIdempotencyStore.
 *
 * Sprint 2.5.5: Hardening da API — armazenamento em memória para idempotência.
 *
 * @module backend/shared/http/idempotency/InMemoryIdempotencyStore
 */

const IIdempotencyStore = require('./IIdempotencyStore');

class InMemoryIdempotencyStore extends IIdempotencyStore {
  constructor() {
    super();
    this._store = new Map();
    this._ttlStore = new Map();
  }

  /**
   * Armazena o resultado de uma operação idempotente.
   * @param {string} key - Chave de idempotência
   * @param {Object} result - Resultado da operação
   * @param {number} [ttl] - Time to live em segundos (padrão: 3600)
   * @returns {Promise<void>}
   */
  async store(key, result, ttl = 3600) {
    this._store.set(key, {
      result,
      timestamp: Date.now()
    });

    if (ttl > 0) {
      this._ttlStore.set(key, Date.now() + (ttl * 1000));
    }
  }

  /**
   * Recupera o resultado de uma operação idempotente.
   * @param {string} key - Chave de idempotência
   * @returns {Promise<Object|null>}
   */
  async retrieve(key) {
    this._cleanupExpired();

    const entry = this._store.get(key);
    if (!entry) {
      return null;
    }

    return entry.result;
  }

  /**
   * Verifica se uma chave existe.
   * @param {string} key - Chave de idempotência
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    this._cleanupExpired();
    return this._store.has(key);
  }

  /**
   * Remove uma chave.
   * @param {string} key - Chave de idempotência
   * @returns {Promise<void>}
   */
  async delete(key) {
    this._store.delete(key);
    this._ttlStore.delete(key);
  }

  /**
   * Limpa entradas expiradas.
   * @private
   */
  _cleanupExpired() {
    const now = Date.now();
    for (const [key, expiry] of this._ttlStore.entries()) {
      if (now > expiry) {
        this._store.delete(key);
        this._ttlStore.delete(key);
      }
    }
  }

  /**
   * Limpa todo o armazenamento.
   * @returns {Promise<void>}
   */
  async clear() {
    this._store.clear();
    this._ttlStore.clear();
  }

  /**
   * Retorna o tamanho atual do armazenamento.
   * @returns {number}
   */
  size() {
    this._cleanupExpired();
    return this._store.size;
  }
}

module.exports = InMemoryIdempotencyStore;
