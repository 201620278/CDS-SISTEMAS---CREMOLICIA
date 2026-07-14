const DomainError = require('./DomainError');

class PrestacaoSemMovimentacoesError extends DomainError {
  static CODIGO = 'PRESTACAO_SEM_MOVIMENTACOES';

  /**
   * @param {string} grupoPrestacaoContasId
   */
  constructor(grupoPrestacaoContasId) {
    super('Prestação sem movimentações no ledger', {
      codigo: PrestacaoSemMovimentacoesError.CODIGO,
      detalhes: { grupoPrestacaoContasId }
    });
  }
}

module.exports = PrestacaoSemMovimentacoesError;
