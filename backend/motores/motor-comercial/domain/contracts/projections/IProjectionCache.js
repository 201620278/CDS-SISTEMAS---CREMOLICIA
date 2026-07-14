/**
 * IProjectionCache — Contrato de cache para projeções (sem implementação).
 *
 * Sprint 2.4.4: preparação arquitetural.
 *
 * @abstract
 * @class IProjectionCache
 */

class IProjectionCache {
  constructor() {
    if (new.target === IProjectionCache) {
      throw new Error('IProjectionCache é abstrata e não pode ser instanciada diretamente');
    }
  }

  /** @abstract @returns {Promise<*>} */
  async obter(_chave) {
    throw new Error(`${this.constructor.name} deve implementar obter()`);
  }

  /** @abstract @returns {Promise<void>} */
  async armazenar(_chave, _valor, _ttlMs = null) {
    throw new Error(`${this.constructor.name} deve implementar armazenar()`);
  }

  /** @abstract @returns {Promise<void>} */
  async invalidar(_chave) {
    throw new Error(`${this.constructor.name} deve implementar invalidar()`);
  }
}

module.exports = IProjectionCache;
