/**
 * IMovimentacaoComercialRepository — Contrato do Ledger Comercial (append-only).
 *
 * @abstract
 * @class IMovimentacaoComercialRepository
 */

class IMovimentacaoComercialRepository {
  constructor() {
    if (new.target === IMovimentacaoComercialRepository) {
      throw new Error('IMovimentacaoComercialRepository é abstrata e não pode ser instanciada diretamente');
    }
  }

  /** @abstract @returns {Promise<Object|null>} */
  async buscarPorId(_id) {
    throw new Error(`${this.constructor.name} deve implementar buscarPorId()`);
  }

  /** @abstract @returns {Promise<Object[]>} */
  async listar(_filtros) {
    throw new Error(`${this.constructor.name} deve implementar listar()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async inserir(_dados) {
    throw new Error(`${this.constructor.name} deve implementar inserir()`);
  }
}

module.exports = IMovimentacaoComercialRepository;
