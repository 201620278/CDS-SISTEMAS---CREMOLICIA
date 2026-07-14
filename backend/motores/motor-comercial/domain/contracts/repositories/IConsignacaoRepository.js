/**
 * IConsignacaoRepository — Contrato do Aggregate Consignacao.
 *
 * @abstract
 * @class IConsignacaoRepository
 */

class IConsignacaoRepository {
  constructor() {
    if (new.target === IConsignacaoRepository) {
      throw new Error('IConsignacaoRepository é abstrata e não pode ser instanciada diretamente');
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

  /** @abstract @returns {Promise<Object|null>} */
  async atualizar(_id, _dados) {
    throw new Error(`${this.constructor.name} deve implementar atualizar()`);
  }

  /** @abstract @returns {Promise<Object>} */
  async salvar(_dados) {
    throw new Error(`${this.constructor.name} deve implementar salvar()`);
  }
}

module.exports = IConsignacaoRepository;
