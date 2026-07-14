/**
 * ResumoInsightDTO — visão resumida do resultado da engine.
 */
class ResumoInsightDTO {
  constructor({ quantidade = 0, categorias = [], severidades = [], tempoExecucao = 0 }) {
    this.quantidade = quantidade;
    this.categorias = categorias;
    this.severidades = severidades;
    this.tempoExecucao = tempoExecucao;
  }
}

module.exports = ResumoInsightDTO;
