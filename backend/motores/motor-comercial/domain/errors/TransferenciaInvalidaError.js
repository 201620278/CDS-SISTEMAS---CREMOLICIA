const DomainError = require('./DomainError');

class TransferenciaInvalidaError extends DomainError {
  static CODIGO = 'TRANSFERENCIA_INVALIDA';

  /**
   * @param {string} [motivo]
   * @param {Object} [detalhes]
   */
  constructor(motivo, detalhes = {}) {
    super(motivo || 'Transferência inválida', {
      codigo: TransferenciaInvalidaError.CODIGO,
      detalhes
    });
  }
}

module.exports = TransferenciaInvalidaError;
