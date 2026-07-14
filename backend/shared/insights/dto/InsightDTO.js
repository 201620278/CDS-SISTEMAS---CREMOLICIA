/**
 * InsightDTO — representação resumida de um insight.
 */
class InsightDTO {
  constructor({ codigo, categoria, prioridade, severidade, titulo, mensagem, dados = {} }) {
    this.codigo = codigo;
    this.categoria = categoria;
    this.prioridade = prioridade;
    this.severidade = severidade;
    this.titulo = titulo;
    this.mensagem = mensagem;
    this.dados = dados;
  }

  static fromRule(result, rule) {
    return new InsightDTO({
      codigo: result.codigo || rule.codigo(),
      categoria: result.categoria || rule.categoria(),
      prioridade: result.prioridade || rule.prioridade(),
      severidade: result.severidade || rule.severidade(),
      titulo: result.titulo || 'Insight',
      mensagem: result.mensagem || '',
      dados: result.dados || {}
    });
  }
}

module.exports = InsightDTO;
