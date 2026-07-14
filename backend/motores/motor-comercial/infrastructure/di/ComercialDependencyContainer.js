/**
 * ComercialDependencyContainer — Injeção de dependências do Motor Comercial.
 *
 * Sprint 2.2.5: centraliza resolução — Use Cases não instanciam dependências.
 *
 * @class ComercialDependencyContainer
 */

class ComercialDependencyContainer {
  constructor() {
    /** @private @type {Map<string, { factory: Function, singleton: boolean }>} */
    this._registros = new Map();
    /** @private @type {Map<string, *>} */
    this._instancias = new Map();
  }

  /**
   * @param {string} token
   * @param {Function} factory
   * @param {Object} [opcoes]
   * @param {boolean} [opcoes.singleton=true]
   */
  registrar(token, factory, opcoes = {}) {
    this._registros.set(token, {
      factory,
      singleton: opcoes.singleton !== false
    });
  }

  /**
   * @param {string} token
   * @returns {*}
   */
  resolver(token) {
    const registro = this._registros.get(token);
    if (!registro) {
      throw new Error(`Dependência não registrada: ${token}`);
    }

    if (registro.singleton && this._instancias.has(token)) {
      return this._instancias.get(token);
    }

    const instancia = registro.factory(this);
    if (registro.singleton) {
      this._instancias.set(token, instancia);
    }
    return instancia;
  }

  /**
   * @returns {boolean}
   */
  possui(token) {
    return this._registros.has(token);
  }

  /**
   * @returns {void}
   */
  limpar() {
    this._instancias.clear();
  }
}

module.exports = ComercialDependencyContainer;
