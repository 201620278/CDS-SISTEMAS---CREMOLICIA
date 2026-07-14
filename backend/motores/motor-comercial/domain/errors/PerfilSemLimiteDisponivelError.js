const DomainError = require('./DomainError');

class PerfilSemLimiteDisponivelError extends DomainError {
  static CODIGO = 'PERFIL_SEM_LIMITE_DISPONIVEL';

  /**
   * @param {Object} [detalhes]
   */
  constructor(detalhes = {}) {
    super('Perfil sem limite comercial disponível', {
      codigo: PerfilSemLimiteDisponivelError.CODIGO,
      detalhes
    });
  }
}

module.exports = PerfilSemLimiteDisponivelError;
