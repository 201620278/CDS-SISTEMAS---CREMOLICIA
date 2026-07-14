const DomainError = require('./DomainError');

class ProdutoDuplicadoNaConsignacaoError extends DomainError {
  static CODIGO = 'PRODUTO_DUPLICADO_NA_CONSIGNACAO';

  /**
   * @param {number|string} consignacaoId
   * @param {number|string} produtoId
   */
  constructor(consignacaoId, produtoId) {
    super('Produto já existe na consignação', {
      codigo: ProdutoDuplicadoNaConsignacaoError.CODIGO,
      detalhes: { consignacaoId, produtoId }
    });
  }
}

module.exports = ProdutoDuplicadoNaConsignacaoError;
