/**
 * IRateLimitStore — Interface para armazenamento de rate limiting.
 *
 * Sprint 2.5.5: Hardening da API — interface de rate limiting.
 *
 * @module backend/shared/http/rate-limit/IRateLimitStore
 */

class IRateLimitStore {
  /**
   * Incrementa o contador de requisições.
   * @param {string} key - Chave de identificação (IP, usuário, rota)
   * @param {number} windowMs - Janela de tempo em milissegundos
   * @returns {Promise<number>} - Contador atual
   */
  async increment(key, windowMs) {
    throw new Error('Method not implemented');
  }

  /**
   * Obtém o contador atual.
   * @param {string} key - Chave de identificação
   * @returns {Promise<number>} - Contador atual
   */
  async get(key) {
    throw new Error('Method not implemented');
  }

  /**
   * Reseta o contador.
   * @param {string} key - Chave de identificação
   * @returns {Promise<void>}
   */
  async reset(key) {
    throw new Error('Method not implemented');
  }

  /**
   * Verifica se está bloqueado.
   * @param {string} key - Chave de identificação
   * @returns {Promise<boolean>}
   */
  async isBlocked(key) {
    throw new Error('Method not implemented');
  }

  /**
   * Bloqueia temporariamente.
   * @param {string} key - Chave de identificação
   * @param {number} durationMs - Duração do bloqueio em milissegundos
   * @returns {Promise<void>}
   */
  async block(key, durationMs) {
    throw new Error('Method not implemented');
  }
}

module.exports = IRateLimitStore;
