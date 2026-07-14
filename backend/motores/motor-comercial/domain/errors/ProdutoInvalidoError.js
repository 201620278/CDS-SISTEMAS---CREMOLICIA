const DomainError = require('./DomainError');

class ProdutoInvalidoError extends DomainError {
  static CODIGO = 'PRODUTO_INVALIDO';

  /**
   * @param {number|string} [produtoId]
   * @param {string} [motivo]
   */
  constructor(produtoId, motivo) {
    super(motivo || 'Produto inválido', {
      codigo: ProdutoInvalidoError.CODIGO,
      detalhes: { produtoId }
    });
  }
}

module.exports = ProdutoInvalidoError;
