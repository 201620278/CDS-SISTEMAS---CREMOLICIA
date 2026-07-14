const DomainError = require('./DomainError');

class LimiteComercialInsuficienteError extends DomainError {
  static CODIGO = 'LIMITE_COMERCIAL_INSUFICIENTE';

  /**
   * @param {Object} [detalhes]
   */
  constructor(detalhes = {}) {
    super('Limite comercial insuficiente', {
      codigo: LimiteComercialInsuficienteError.CODIGO,
      detalhes
    });
  }
}

module.exports = LimiteComercialInsuficienteError;
