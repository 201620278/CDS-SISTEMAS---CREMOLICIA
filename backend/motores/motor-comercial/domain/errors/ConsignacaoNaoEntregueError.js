const DomainError = require('./DomainError');

class ConsignacaoNaoEntregueError extends DomainError {
  static CODIGO = 'CONSIGNACAO_NAO_ENTREGUE';

  /**
   * @param {number|string} [consignacaoId]
   * @param {string} [statusAtual]
   */
  constructor(consignacaoId, statusAtual) {
    super('Consignação não está entregue', {
      codigo: ConsignacaoNaoEntregueError.CODIGO,
      detalhes: { consignacaoId, statusAtual }
    });
  }
}

module.exports = ConsignacaoNaoEntregueError;
