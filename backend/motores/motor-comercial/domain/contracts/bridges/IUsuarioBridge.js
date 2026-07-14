/**
 * IUsuarioBridge — Contrato de integração com Usuários.
 *
 * @abstract
 * @class IUsuarioBridge
 */

class IUsuarioBridge {
  constructor() {
    if (new.target === IUsuarioBridge) {
      throw new Error('IUsuarioBridge é abstrata e não pode ser instanciada diretamente');
    }
  }

  /** @abstract @returns {Promise<Object|null>} */
  async buscarPorId(_usuarioId) {
    throw new Error(`${this.constructor.name} deve implementar buscarPorId()`);
  }

  /** @abstract @returns {Promise<boolean>} */
  async possuiPermissao(_usuarioId, _permissao) {
    throw new Error(`${this.constructor.name} deve implementar possuiPermissao()`);
  }
}

module.exports = IUsuarioBridge;
