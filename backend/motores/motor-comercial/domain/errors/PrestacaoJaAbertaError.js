const DomainError = require('./DomainError');

class PrestacaoJaAbertaError extends DomainError {
  static CODIGO = 'PRESTACAO_JA_ABERTA';

  /**
   * @param {string} [grupoPrestacaoContasId]
   */
  constructor(grupoPrestacaoContasId) {
    super('Prestação de contas já está aberta', {
      codigo: PrestacaoJaAbertaError.CODIGO,
      detalhes: { grupoPrestacaoContasId }
    });
  }
}

module.exports = PrestacaoJaAbertaError;
