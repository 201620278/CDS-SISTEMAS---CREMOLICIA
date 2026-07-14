const DomainError = require('./DomainError');

class QuantidadeInvalidaError extends DomainError {
  static CODIGO = 'QUANTIDADE_INVALIDA';

  /**
   * @param {*} [quantidade]
   */
  constructor(quantidade) {
    super('Quantidade inválida', {
      codigo: QuantidadeInvalidaError.CODIGO,
      detalhes: { quantidade }
    });
  }
}

module.exports = QuantidadeInvalidaError;
