const DomainError = require('./DomainError');

class EntregaJaRealizadaError extends DomainError {
  static CODIGO = 'ENTREGA_JA_REALIZADA';

  /**
   * @param {number|string} [consignacaoId]
   */
  constructor(consignacaoId) {
    super('Entrega já foi realizada para esta consignação', {
      codigo: EntregaJaRealizadaError.CODIGO,
      detalhes: { consignacaoId }
    });
  }
}

module.exports = EntregaJaRealizadaError;
