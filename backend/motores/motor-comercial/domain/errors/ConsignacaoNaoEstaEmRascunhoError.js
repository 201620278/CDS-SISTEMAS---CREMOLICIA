const DomainError = require('./DomainError');

class ConsignacaoNaoEstaEmRascunhoError extends DomainError {
  static CODIGO = 'CONSIGNACAO_NAO_ESTA_EM_RASCUNHO';

  /**
   * @param {number|string} [consignacaoId]
   * @param {string} [statusAtual]
   */
  constructor(consignacaoId, statusAtual) {
    super('Consignação não está em rascunho', {
      codigo: ConsignacaoNaoEstaEmRascunhoError.CODIGO,
      detalhes: { consignacaoId, statusAtual }
    });
  }
}

module.exports = ConsignacaoNaoEstaEmRascunhoError;
