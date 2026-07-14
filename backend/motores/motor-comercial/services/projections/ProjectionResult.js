/**
 * ProjectionResult — Retorno padrão dos Projection Services.
 *
 * Sprint 2.4.4: leitura/projeção — sem regras de negócio.
 *
 * @class ProjectionResult
 */

class ProjectionResult {
  /**
   * @param {Object} opcoes
   * @param {*} [opcoes.dados]
   * @param {Object} [opcoes.totais]
   * @param {Object} [opcoes.indicadores]
   * @param {Object} [opcoes.paginacao]
   * @param {Object} [opcoes.metadata]
   */
  constructor({ dados = null, totais = {}, indicadores = {}, paginacao = {}, metadata = {} }) {
    this.dados = dados;
    this.totais = totais;
    this.indicadores = indicadores;
    this.paginacao = paginacao;
    this.metadata = metadata;
  }

  /**
   * @param {Object} [opcoes]
   * @returns {ProjectionResult}
   */
  static create(opcoes = {}) {
    return new ProjectionResult(opcoes);
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      dados: this.dados,
      totais: this.totais,
      indicadores: this.indicadores,
      paginacao: this.paginacao,
      metadata: this.metadata
    };
  }
}

module.exports = ProjectionResult;
