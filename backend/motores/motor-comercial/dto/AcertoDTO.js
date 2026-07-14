/**
 * AcertoDTO — Contrato de prestação de contas / acerto.
 *
 * Sprint 1.1: apenas estrutura.
 *
 * @class AcertoDTO
 */

class AcertoDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.consignacaoId = dados.consignacaoId ?? dados.consignacao_id ?? null;
    this.itens = dados.itens ?? [];
    this.desconto = dados.desconto ?? 0;
    this.observacao = dados.observacao ?? null;
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {AcertoDTO}
   */
  static create(plain) {
    return new AcertoDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      consignacaoId: this.consignacaoId,
      itens: this.itens,
      desconto: this.desconto,
      observacao: this.observacao
    };
  }
}

module.exports = AcertoDTO;
