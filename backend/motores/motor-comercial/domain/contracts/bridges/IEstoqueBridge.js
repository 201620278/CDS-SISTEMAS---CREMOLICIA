/**
 * IEstoqueBridge — Contrato de integração com Estoque.
 *
 * @abstract
 * @class IEstoqueBridge
 */

class IEstoqueBridge {
  constructor() {
    if (new.target === IEstoqueBridge) {
      throw new Error('IEstoqueBridge é abstrata e não pode ser instanciada diretamente');
    }
  }

  /** @abstract @returns {Promise<Object>} */
  async reservarEstoque(_dados) {
    throw new Error(`${this.constructor.name} deve implementar reservarEstoque()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async baixarEstoque(_dados) {
    throw new Error(`${this.constructor.name} deve implementar baixarEstoque()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async estornarEstoque(_dados) {
    throw new Error(`${this.constructor.name} deve implementar estornarEstoque()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async registrarSaidaConsignacao(_dados) {
    throw new Error(`${this.constructor.name} deve implementar registrarSaidaConsignacao()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async registrarEntradaConsignacao(_dados) {
    throw new Error(`${this.constructor.name} deve implementar registrarEntradaConsignacao()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async registrarTransferencia(_dados) {
    throw new Error(`${this.constructor.name} deve implementar registrarTransferencia()`);
  }
}

module.exports = IEstoqueBridge;
