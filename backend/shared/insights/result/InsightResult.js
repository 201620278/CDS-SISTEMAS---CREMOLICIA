/**
 * InsightResult — resultado padronizado da engine.
 */
class InsightResult {
  constructor({ insights = [], estatisticas = {}, tempoExecucao = 0, quantidade = 0, categorias = [], severidades = [], warnings = [] } = {}) {
    this.insights = insights;
    this.estatisticas = estatisticas;
    this.tempoExecucao = tempoExecucao;
    this.quantidade = quantidade;
    this.categorias = categorias;
    this.severidades = severidades;
    this.warnings = warnings;
  }

  toJSON() {
    return {
      insights: this.insights,
      estatisticas: this.estatisticas,
      tempoExecucao: this.tempoExecucao,
      quantidade: this.quantidade,
      categorias: this.categorias,
      severidades: this.severidades,
      warnings: this.warnings
    };
  }
}

module.exports = InsightResult;
