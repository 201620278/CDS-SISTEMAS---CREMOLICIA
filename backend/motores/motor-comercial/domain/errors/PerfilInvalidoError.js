const DomainError = require('./DomainError');

class PerfilInvalidoError extends DomainError {
  static CODIGO = 'PERFIL_INVALIDO';

  /**
   * @param {string} [motivo]
   * @param {Object} [detalhes]
   */
  constructor(motivo, detalhes = {}) {
    super(motivo || 'Perfil comercial inválido', {
      codigo: PerfilInvalidoError.CODIGO,
      detalhes
    });
  }
}

module.exports = PerfilInvalidoError;
