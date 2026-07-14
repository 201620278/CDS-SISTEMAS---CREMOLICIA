/**
 * ResumoPrestacaoDTO — Projeção de resumo da prestação de contas.
 *
 * @class ResumoPrestacaoDTO
 */

class ResumoPrestacaoDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.consignacaoId = dados.consignacaoId ?? null;
    this.grupoPrestacaoContasId = dados.grupoPrestacaoContasId ?? null;
    this.documento = dados.documento ?? null;
    this.grupoPrestacaoContas = dados.grupoPrestacaoContas ?? null;
    this.totalVendido = Number(dados.totalVendido ?? 0);
    this.totalDevolvido = Number(dados.totalDevolvido ?? 0);
    this.totalPerdido = Number(dados.totalPerdido ?? 0);
    this.totalCortesia = Number(dados.totalCortesia ?? 0);
    this.totalPago = Number(dados.totalPago ?? 0);
    this.saldo = Number(dados.saldo ?? 0);
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {ResumoPrestacaoDTO}
   */
  static create(plain) {
    return new ResumoPrestacaoDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      consignacaoId: this.consignacaoId,
      grupoPrestacaoContasId: this.grupoPrestacaoContasId,
      documento: this.documento,
      grupoPrestacaoContas: this.grupoPrestacaoContas,
      totalVendido: this.totalVendido,
      totalDevolvido: this.totalDevolvido,
      totalPerdido: this.totalPerdido,
      totalCortesia: this.totalCortesia,
      totalPago: this.totalPago,
      saldo: this.saldo
    };
  }
}

module.exports = ResumoPrestacaoDTO;
