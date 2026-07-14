const DomainError = require('./DomainError');

class QuantidadeSuperiorAoSaldoError extends DomainError {
  static CODIGO = 'QUANTIDADE_SUPERIOR_AO_SALDO';

  /**
   * @param {Object} [detalhes]
   */
  constructor(detalhes = {}) {
    super('Quantidade superior ao saldo disponível do item', {
      codigo: QuantidadeSuperiorAoSaldoError.CODIGO,
      detalhes
    });
  }
}

module.exports = QuantidadeSuperiorAoSaldoError;
