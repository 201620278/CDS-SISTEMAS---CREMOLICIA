const DomainError = require('./DomainError');

class SaldoPrestacaoInconsistenteError extends DomainError {
  static CODIGO = 'SALDO_PRESTACAO_INCONSISTENTE';

  /**
   * @param {Object} detalhes
   */
  constructor(detalhes = {}) {
    super('Saldo da prestação inconsistente com o ledger', {
      codigo: SaldoPrestacaoInconsistenteError.CODIGO,
      detalhes
    });
  }
}

module.exports = SaldoPrestacaoInconsistenteError;
