const DomainError = require('./DomainError');

class ConsignacaoNaoEncontradaError extends DomainError {
  static CODIGO = 'CONSIGNACAO_NAO_ENCONTRADA';

  /**
   * @param {number|string} [consignacaoId]
   */
  constructor(consignacaoId) {
    super(
      consignacaoId != null
        ? `Consignação não encontrada: ${consignacaoId}`
        : 'Consignação não encontrada',
      { codigo: ConsignacaoNaoEncontradaError.CODIGO, detalhes: { consignacaoId } }
    );
  }
}

module.exports = ConsignacaoNaoEncontradaError;
