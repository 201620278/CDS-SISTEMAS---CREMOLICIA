const DomainError = require('./DomainError');

class PrestacaoNaoAbertaError extends DomainError {
  static CODIGO = 'PRESTACAO_NAO_ABERTA';

  /**
   * @param {number|string} [consignacaoId]
   */
  constructor(consignacaoId) {
    super('Prestação de contas não está aberta', {
      codigo: PrestacaoNaoAbertaError.CODIGO,
      detalhes: { consignacaoId }
    });
  }
}

module.exports = PrestacaoNaoAbertaError;
