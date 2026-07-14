/**
 * NovaConsignacaoDTO — Contrato de criação de consignação.
 *
 * Sprint 1.1: apenas estrutura.
 *
 * @class NovaConsignacaoDTO
 */

class NovaConsignacaoDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.clienteId = dados.clienteId ?? dados.cliente_id ?? null;
    this.itens = dados.itens ?? [];
    this.observacao = dados.observacao ?? null;
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {NovaConsignacaoDTO}
   */
  static create(plain) {
    return new NovaConsignacaoDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      clienteId: this.clienteId,
      itens: this.itens,
      observacao: this.observacao
    };
  }
}

module.exports = NovaConsignacaoDTO;
