/**
 * ContaCorrenteDTO — Projeção da Conta Corrente Comercial.
 *
 * @class ContaCorrenteDTO
 */

class ContaCorrenteDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.escopo = dados.escopo ?? (dados.consignacaoId != null ? 'CONSIGNACAO' : 'CLIENTE');
    this.consignacaoId = dados.consignacaoId ?? null;
    this.clienteId = dados.clienteId ?? null;
    this.saldoInicial = Number(dados.saldoInicial ?? 0);
    this.vendas = Number(dados.vendas ?? 0);
    this.perdas = Number(dados.perdas ?? 0);
    this.cortesias = Number(dados.cortesias ?? 0);
    this.pagamentos = Number(dados.pagamentos ?? 0);
    this.saldoAtual = Number(dados.saldoAtual ?? 0);
    this.lancamentos = dados.lancamentos ?? [];
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {ContaCorrenteDTO}
   */
  static create(plain) {
    return new ContaCorrenteDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      escopo: this.escopo,
      consignacaoId: this.consignacaoId,
      clienteId: this.clienteId,
      saldoInicial: this.saldoInicial,
      vendas: this.vendas,
      perdas: this.perdas,
      cortesias: this.cortesias,
      pagamentos: this.pagamentos,
      saldoAtual: this.saldoAtual,
      lancamentos: this.lancamentos
    };
  }
}

module.exports = ContaCorrenteDTO;
