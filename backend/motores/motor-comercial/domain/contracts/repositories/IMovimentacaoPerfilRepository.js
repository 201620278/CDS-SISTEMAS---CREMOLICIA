/**
 * IMovimentacaoPerfilRepository — Contrato do Ledger do Perfil (append-only).
 *
 * @abstract
 * @class IMovimentacaoPerfilRepository
 */

class IMovimentacaoPerfilRepository {
  constructor() {
    if (new.target === IMovimentacaoPerfilRepository) {
      throw new Error('IMovimentacaoPerfilRepository é abstrata e não pode ser instanciada diretamente');
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

module.exports = IMovimentacaoPerfilRepository;
