/**
 * BridgeFactory — Factory para resolver Bridges.
 *
 * Sprint 2.6: Bridges Oficiais — factory de bridges.
 *
 * @module motores/motor-comercial/bridges/BridgeFactory
 */

const registry = require('./BridgeRegistry');

class BridgeFactory {
  /**
   * Cria uma instância de Bridge.
   * @param {string} name - Nome da Bridge
   * @param {Object} [dependencies] - Dependências da Bridge
   * @returns {Object}
   */
  static create(name, dependencies = {}) {
    const bridgeFactory = registry.get(name);

    if (!bridgeFactory) {
      throw new Error(`Bridge ${name} não encontrada no registro`);
    }

    return bridgeFactory(dependencies);
  }

  /**
   * Verifica se uma Bridge está disponível.
   * @param {string} name - Nome da Bridge
   * @returns {boolean}
   */
  static isAvailable(name) {
    return registry.has(name);
  }

  /**
   * Lista todas as Bridges disponíveis.
   * @returns {Array<string>}
   */
  static listAvailable() {
    return registry.list();
  }

  /**
   * Obtém metadados de uma Bridge.
   * @param {string} name - Nome da Bridge
   * @returns {Object|null}
   */
  static getMetadata(name) {
    return registry.getMetadata(name);
  }

  /**
   * Lista todas as Bridges com metadados.
   * @returns {Array<Object>}
   */
  static listWithMetadata() {
    return registry.listWithMetadata();
  }
}

module.exports = BridgeFactory;
