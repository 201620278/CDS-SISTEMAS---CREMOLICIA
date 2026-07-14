/**
 * IIdempotencyStore — Interface para armazenamento de idempotência.
 *
 * Sprint 2.5.5: Hardening da API — interface de idempotência.
 *
 * @module backend/shared/http/idempotency/IIdempotencyStore
 */

class IIdempotencyStore {
  /**
   * Armazena o resultado de uma operação idempotente.
   * @param {string} key - Chave de idempotência
   * @param {Object} result - Resultado da operação
   * @param {number} [ttl] - Time to live em segundos
   * @returns {Promise<void>}
   */
  async store(key, result, ttl) {
    throw new Error('Method not implemented');
  }

  /**
   * Recupera o resultado de uma operação idempotente.
   * @param {string} key - Chave de idempotência
   * @returns {Promise<Object|null>}
   */
  async retrieve(key) {
    throw new Error('Method not implemented');
  }

  /**
   * Verifica se uma chave existe.
   * @param {string} key - Chave de idempotência
   * @returns {Promise<boolean>}
   */
  async exists(key) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove uma chave.
   * @param {string} key - Chave de idempotência
   * @returns {Promise<void>}
   */
  async delete(key) {
    throw new Error('Method not implemented');
  }
}

module.exports = IIdempotencyStore;
