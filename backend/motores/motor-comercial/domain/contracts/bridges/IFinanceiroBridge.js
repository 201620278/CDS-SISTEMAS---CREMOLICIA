/**
 * IFinanceiroBridge — Contrato de integração com Financeiro.
 *
 * @abstract
 * @class IFinanceiroBridge
 */

class IFinanceiroBridge {
  constructor() {
    if (new.target === IFinanceiroBridge) {
      throw new Error('IFinanceiroBridge é abstrata e não pode ser instanciada diretamente');
    }
  }

  /** @abstract @returns {Promise<Object>} */
  async registrarRecebimento(_dados) {
    throw new Error(`${this.constructor.name} deve implementar registrarRecebimento()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async registrarReceitaConsignacao(_dados) {
    throw new Error(`${this.constructor.name} deve implementar registrarReceitaConsignacao()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async registrarPerda(_dados) {
    throw new Error(`${this.constructor.name} deve implementar registrarPerda()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async registrarTitulo(_dados) {
    throw new Error(`${this.constructor.name} deve implementar registrarTitulo()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async estornarLancamento(_dados) {
    throw new Error(`${this.constructor.name} deve implementar estornarLancamento()`);
  }
}

module.exports = IFinanceiroBridge;
