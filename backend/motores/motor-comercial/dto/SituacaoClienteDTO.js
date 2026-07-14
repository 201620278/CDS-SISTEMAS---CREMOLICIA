/**
 * SituacaoClienteDTO — Projeção da situação comercial do cliente.
 *
 * @class SituacaoClienteDTO
 */

class SituacaoClienteDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.clienteId = dados.clienteId ?? null;
    this.perfil = dados.perfil ?? null;
    this.limite = Number(dados.limite ?? 0);
    this.limiteComercial = Number(dados.limiteComercial ?? dados.limite ?? 0);
    this.saldo = Number(dados.saldo ?? 0);
    this.saldoDevedor = Number(dados.saldoDevedor ?? dados.saldo ?? 0);
    this.saldoCredor = Number(dados.saldoCredor ?? 0);
    this.creditoDisponivel = Number(
      dados.creditoDisponivel
      ?? dados.limiteDisponivel
      ?? Math.max(0, this.limiteComercial - this.saldoDevedor)
    );
    this.limiteDisponivel = this.creditoDisponivel;
    this.saldoEmAberto = Number(dados.saldoEmAberto ?? this.saldo);
    this.consignacoesAbertas = dados.consignacoesAbertas ?? [];
    this.prestacaoAtiva = dados.prestacaoAtiva ?? null;
    this.ultimaMovimentacao = dados.ultimaMovimentacao ?? null;
    this.ultimoPagamento = dados.ultimoPagamento ?? null;
    this.statusGeral = dados.statusGeral ?? 'INDEFINIDO';
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {SituacaoClienteDTO}
   */
  static create(plain) {
    return new SituacaoClienteDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      clienteId: this.clienteId,
      perfil: this.perfil,
      limite: this.limite,
      limiteComercial: this.limiteComercial,
      saldo: this.saldo,
      saldoDevedor: this.saldoDevedor,
      saldoCredor: this.saldoCredor,
      creditoDisponivel: this.creditoDisponivel,
      limiteDisponivel: this.limiteDisponivel,
      saldoEmAberto: this.saldoEmAberto,
      consignacoesAbertas: this.consignacoesAbertas,
      prestacaoAtiva: this.prestacaoAtiva,
      ultimaMovimentacao: this.ultimaMovimentacao,
      ultimoPagamento: this.ultimoPagamento,
      statusGeral: this.statusGeral
    };
  }
}

module.exports = SituacaoClienteDTO;
