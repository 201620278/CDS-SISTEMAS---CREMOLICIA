/**
 * IConsignacaoItemRepository — Contrato da entidade ConsignacaoItem.
 *
 * @abstract
 * @class IConsignacaoItemRepository
 */

class IConsignacaoItemRepository {
  constructor() {
    if (new.target === IConsignacaoItemRepository) {
      throw new Error('IConsignacaoItemRepository é abstrata e não pode ser instanciada diretamente');
    }
  }

  /** @abstract @returns {Promise<Object|null>} */
  async buscarPorId(_id) {
    throw new Error(`${this.constructor.name} deve implementar buscarPorId()`);
  }

  /** @abstract @returns {Promise<Object[]>} */
  async listarPorConsignacao(_consignacaoId, _filtros) {
    throw new Error(`${this.constructor.name} deve implementar listarPorConsignacao()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async inserir(_dados) {
    throw new Error(`${this.constructor.name} deve implementar inserir()`);
  }

  /** @abstract @returns {Promise<Object|null>} */
  async atualizar(_id, _dados) {
    throw new Error(`${this.constructor.name} deve implementar atualizar()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async salvar(_dados) {
    throw new Error(`${this.constructor.name} deve implementar salvar()`);
  }

  /** @abstract @returns {Promise<boolean>} */
  async remover(_id) {
    throw new Error(`${this.constructor.name} deve implementar remover()`);
  }
}

module.exports = IConsignacaoItemRepository;
