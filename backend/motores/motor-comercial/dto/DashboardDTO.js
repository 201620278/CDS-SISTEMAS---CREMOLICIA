/**
 * DashboardDTO — Projeção consolidada para dashboard comercial.
 *
 * @class DashboardDTO
 */

class DashboardDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.cards = dados.cards ?? [];
    this.kpis = dados.kpis ?? {};
    this.totais = dados.totais ?? {};
    this.alertas = dados.alertas ?? [];
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {DashboardDTO}
   */
  static create(plain) {
    return new DashboardDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      cards: this.cards,
      kpis: this.kpis,
      totais: this.totais,
      alertas: this.alertas
    };
  }
}

module.exports = DashboardDTO;
