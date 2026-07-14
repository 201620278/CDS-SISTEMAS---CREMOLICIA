/**
 * IClienteBridge — Contrato de integração com Clientes.
 *
 * @abstract
 * @class IClienteBridge
 */

class IClienteBridge {
  constructor() {
    if (new.target === IClienteBridge) {
      throw new Error('IClienteBridge é abstrata e não pode ser instanciada diretamente');
    }
  }

  /** @abstract @returns {Promise<Object|null>} */
  async buscarPorId(_clienteId) {
    throw new Error(`${this.constructor.name} deve implementar buscarPorId()`);
  }

  /** @abstract @returns {Promise<boolean>} */
  async estaAtivo(_clienteId) {
    throw new Error(`${this.constructor.name} deve implementar estaAtivo()`);
  }
}

module.exports = IClienteBridge;
