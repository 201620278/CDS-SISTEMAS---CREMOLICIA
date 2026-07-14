const DomainError = require('./DomainError');

class ProdutoNaoPertencePrestacaoError extends DomainError {
  static CODIGO = 'PRODUTO_NAO_PERTENCE_PRESTACAO';

  /**
   * @param {number|string} consignacaoId
   * @param {number|string} produtoId
   */
  constructor(consignacaoId, produtoId) {
    super('Produto não pertence à consignação/prestação', {
      codigo: ProdutoNaoPertencePrestacaoError.CODIGO,
      detalhes: { consignacaoId, produtoId }
    });
  }
}

module.exports = ProdutoNaoPertencePrestacaoError;
