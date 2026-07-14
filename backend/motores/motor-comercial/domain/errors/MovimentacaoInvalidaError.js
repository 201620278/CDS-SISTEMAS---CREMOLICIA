const DomainError = require('./DomainError');

class MovimentacaoInvalidaError extends DomainError {
  static CODIGO = 'MOVIMENTACAO_INVALIDA';

  /**
   * @param {string} [motivo]
   * @param {Object} [detalhes]
   */
  constructor(motivo, detalhes = {}) {
    super(motivo || 'Movimentação inválida', {
      codigo: MovimentacaoInvalidaError.CODIGO,
      detalhes
    });
  }
}

module.exports = MovimentacaoInvalidaError;
