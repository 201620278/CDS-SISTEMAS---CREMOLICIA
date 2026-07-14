const DomainError = require('./DomainError');

class PrestacaoJaFechadaError extends DomainError {
  static CODIGO = 'PRESTACAO_JA_FECHADA';

  /**
   * @param {string} [grupoPrestacaoContasId]
   */
  constructor(grupoPrestacaoContasId) {
    super('Prestação de contas já está fechada', {
      codigo: PrestacaoJaFechadaError.CODIGO,
      detalhes: { grupoPrestacaoContasId }
    });
  }
}

module.exports = PrestacaoJaFechadaError;
