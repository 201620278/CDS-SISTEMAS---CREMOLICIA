/**
 * CategoriaInsightDTO — representação resumida por categoria.
 */
class CategoriaInsightDTO {
  constructor({ categoria, quantidade = 0 }) {
    this.categoria = categoria;
    this.quantidade = quantidade;
  }
}

module.exports = CategoriaInsightDTO;
