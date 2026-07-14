/**
 * InsightContext — contexto compartilhado para execução de insights.
 */
class InsightContext {
  constructor({
    empresa = null,
    filial = null,
    periodo = null,
    projectionServices = {},
    repositories = {},
    configuracoes = {},
    eventos = [],
    cache = null,
    metadata = {}
  } = {}) {
    this.empresa = empresa;
    this.filial = filial;
    this.periodo = periodo;
    this.projectionServices = projectionServices;
    this.repositories = repositories;
    this.configuracoes = configuracoes;
    this.eventos = eventos;
    this.cache = cache;
    this.metadata = metadata;
  }
}

module.exports = InsightContext;
