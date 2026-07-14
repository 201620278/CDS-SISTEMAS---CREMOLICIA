const DomainError = require('./DomainError');

class PagamentoMaiorQueSaldoError extends DomainError {
  static CODIGO = 'PAGAMENTO_MAIOR_QUE_SALDO';

  /**
   * @param {Object} detalhes
   */
  constructor(detalhes = {}) {
    super(detalhes.mensagem || 'Valor do pagamento excede o saldo da prestação', {
      codigo: PagamentoMaiorQueSaldoError.CODIGO,
      detalhes
    });
  }
}

module.exports = PagamentoMaiorQueSaldoError;
