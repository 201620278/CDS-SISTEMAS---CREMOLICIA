const DomainError = require('./DomainError');

class ProdutoNaoEncontradoNaConsignacaoError extends DomainError {
  static CODIGO = 'PRODUTO_NAO_ENCONTRADO_NA_CONSIGNACAO';

  /**
   * @param {number|string} [consignacaoId]
   * @param {number|string} [produtoId]
   */
  constructor(consignacaoId, produtoId) {
    super('Produto não encontrado na consignação', {
      codigo: ProdutoNaoEncontradoNaConsignacaoError.CODIGO,
      detalhes: { consignacaoId, produtoId }
    });
  }
}

module.exports = ProdutoNaoEncontradoNaConsignacaoError;
