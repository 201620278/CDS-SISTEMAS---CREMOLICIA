/**
 * InMemoryRateLimitStore — Implementação em memória do IRateLimitStore.
 *
 * Sprint 2.5.5: Hardening da API — armazenamento em memória para rate limiting.
 *
 * @module backend/shared/http/rate-limit/InMemoryRateLimitStore
 */

const IRateLimitStore = require('./IRateLimitStore');

class InMemoryRateLimitStore extends IRateLimitStore {
  constructor() {
    super();
    this._counters = new Map();
    this._windows = new Map();
    this._blocks = new Map();
  }

  /**
   * Incrementa o contador de requisições.
   * @param {string} key - Chave de identificação
   * @param {number} windowMs - Janela de tempo em milissegundos
   * @returns {Promise<number>}
   */
  async increment(key, windowMs) {
    this._cleanupExpired();

    const now = Date.now();
    const windowEnd = now + windowMs;

    // Verifica se existe uma janela ativa
    if (!this._windows.has(key) || this._windows.get(key) < now) {
      this._windows.set(key, windowEnd);
      this._counters.set(key, 1);
      return 1;
    }

    // Incrementa contador existente
    const current = this._counters.get(key) || 0;
    this._counters.set(key, current + 1);
    return current + 1;
  }

  /**
   * Obtém o contador atual.
   * @param {string} key - Chave de identificação
   * @returns {Promise<number>}
   */
  async get(key) {
    this._cleanupExpired();
    return this._counters.get(key) || 0;
  }

  /**
   * Reseta o contador.
   * @param {string} key - Chave de identificação
   * @returns {Promise<void>}
   */
  async reset(key) {
    this._counters.delete(key);
    this._windows.delete(key);
  }

  /**
   * Verifica se está bloqueado.
   * @param {string} key - Chave de identificação
   * @returns {Promise<boolean>}
   */
  async isBlocked(key) {
    now = Date.now();
    const blockEnd = this._blocks.get(key);
    
    if (!blockEnd) {
      return false;
    }

    if (now > blockEnd) {
      this._blocks.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Bloqueia temporariamente.
   * @param {string} key - Chave de identificação
   * @param {number} durationMs - Duração do bloqueio em milissegundos
   * @returns {Promise<void>}
   */
  async block(key, durationMs) {
    const blockEnd = Date.now() + durationMs;
    this._blocks.set(key, blockEnd);
  }

  /**
   * Limpa entradas expiradas.
   * @private
   */
  _cleanupExpired() {
    const now = Date.now();

    // Limpa janelas expiradas
    for (const [key, windowEnd] of this._windows.entries()) {
      if (now > windowEnd) {
        this._counters.delete(key);
        this._windows.delete(key);
      }
    }

    // Limpa bloqueios expirados
    for (const [key, blockEnd] of this._blocks.entries()) {
      if (now > blockEnd) {
        this._blocks.delete(key);
      }
    }
  }

  /**
   * Limpa todo o armazenamento.
   * @returns {Promise<void>}
   */
  async clear() {
    this._counters.clear();
    this._windows.clear();
    this._blocks.clear();
  }

  /**
   * Retorna o tamanho atual do armazenamento.
   * @returns {number}
   */
  size() {
    this._cleanupExpired();
    return this._counters.size;
  }
}

module.exports = InMemoryRateLimitStore;
