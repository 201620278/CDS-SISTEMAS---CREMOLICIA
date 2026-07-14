/**
 * IndicadoresDTO — Projeção de indicadores comerciais.
 *
 * @class IndicadoresDTO
 */

class IndicadoresDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.valorConsignado = Number(dados.valorConsignado ?? 0);
    this.valorVendido = Number(dados.valorVendido ?? 0);
    this.valorPerdido = Number(dados.valorPerdido ?? 0);
    this.percentualPerda = Number(dados.percentualPerda ?? 0);
    this.percentualConversao = Number(dados.percentualConversao ?? 0);
    this.ticketMedio = Number(dados.ticketMedio ?? 0);
    this.quantidadePrestacoes = Number(dados.quantidadePrestacoes ?? 0);
    this.quantidadeConsignacoes = Number(dados.quantidadeConsignacoes ?? 0);
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {IndicadoresDTO}
   */
  static create(plain) {
    return new IndicadoresDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      valorConsignado: this.valorConsignado,
      valorVendido: this.valorVendido,
      valorPerdido: this.valorPerdido,
      percentualPerda: this.percentualPerda,
      percentualConversao: this.percentualConversao,
      ticketMedio: this.ticketMedio,
      quantidadePrestacoes: this.quantidadePrestacoes,
      quantidadeConsignacoes: this.quantidadeConsignacoes
    };
  }
}

module.exports = IndicadoresDTO;
