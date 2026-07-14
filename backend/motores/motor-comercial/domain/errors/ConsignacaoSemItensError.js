const DomainError = require('./DomainError');

class ConsignacaoSemItensError extends DomainError {
  static CODIGO = 'CONSIGNACAO_SEM_ITENS';

  /**
   * @param {number|string} [consignacaoId]
   */
  constructor(consignacaoId) {
    super('Consignação não possui itens', {
      codigo: ConsignacaoSemItensError.CODIGO,
      detalhes: { consignacaoId }
    });
  }
}

module.exports = ConsignacaoSemItensError;
