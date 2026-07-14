/**
 * BridgeRegistry — Registro de Bridges disponíveis.
 *
 * Sprint 2.6: Bridges Oficiais — registro de bridges.
 *
 * @module motores/motor-comercial/bridges/BridgeRegistry
 */

class BridgeRegistry {
  constructor() {
    this._bridges = new Map();
    this._metadata = new Map();
  }

  /**
   * Registra uma Bridge.
   * @param {string} name - Nome da Bridge
   * @param {Function} bridgeFactory - Factory da Bridge
   * @param {Object} [metadata] - Metadados da Bridge
   * @returns {void}
   */
  register(name, bridgeFactory, metadata = {}) {
    if (this._bridges.has(name)) {
      throw new Error(`Bridge ${name} já registrada`);
    }

    this._bridges.set(name, bridgeFactory);
    this._metadata.set(name, metadata);
  }

  /**
   * Obtém a factory de uma Bridge.
   * @param {string} name - Nome da Bridge
   * @returns {Function|null}
   */
  get(name) {
    return this._bridges.get(name) || null;
  }

  /**
   * Verifica se uma Bridge está registrada.
   * @param {string} name - Nome da Bridge
   * @returns {boolean}
   */
  has(name) {
    return this._bridges.has(name);
  }

  /**
   * Remove uma Bridge do registro.
   * @param {string} name - Nome da Bridge
   * @returns {boolean}
   */
  unregister(name) {
    return this._bridges.delete(name) && this._metadata.delete(name);
  }

  /**
   * Lista todas as Bridges registradas.
   * @returns {Array<string>}
   */
  list() {
    return Array.from(this._bridges.keys());
  }

  /**
   * Obtém metadados de uma Bridge.
   * @param {string} name - Nome da Bridge
   * @returns {Object|null}
   */
  getMetadata(name) {
    return this._metadata.get(name) || null;
  }

  /**
   * Lista todas as Bridges com metadados.
   * @returns {Array<Object>}
   */
  listWithMetadata() {
    return Array.from(this._bridges.keys()).map(name => ({
      name,
      metadata: this._metadata.get(name) || {}
    }));
  }

  /**
   * Limpa todas as Bridges registradas.
   * @returns {void}
   */
  clear() {
    this._bridges.clear();
    this._metadata.clear();
  }

  /**
   * Retorna o número de Bridges registradas.
   * @returns {number}
   */
  size() {
    return this._bridges.size;
  }
}

// Singleton instance
const registry = new BridgeRegistry();

module.exports = registry;
