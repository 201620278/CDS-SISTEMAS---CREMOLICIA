/**
 * HistoricoDTO — Projeção de histórico comercial.
 *
 * @class HistoricoDTO
 */

class HistoricoDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.filtros = dados.filtros ?? {};
    this.movimentacoes = dados.movimentacoes ?? [];
    this.total = Number(dados.total ?? 0);
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {HistoricoDTO}
   */
  static create(plain) {
    return new HistoricoDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      filtros: this.filtros,
      movimentacoes: this.movimentacoes,
      total: this.total
    };
  }
}

module.exports = HistoricoDTO;
