const DomainError = require('./DomainError');

class ReaberturaNaoAutorizadaError extends DomainError {
  static CODIGO = 'REABERTURA_NAO_AUTORIZADA';

  /**
   * @param {Object} [detalhes]
   */
  constructor(detalhes = {}) {
    super('Reabertura de prestação não autorizada', {
      codigo: ReaberturaNaoAutorizadaError.CODIGO,
      detalhes
    });
  }
}

module.exports = ReaberturaNaoAutorizadaError;
