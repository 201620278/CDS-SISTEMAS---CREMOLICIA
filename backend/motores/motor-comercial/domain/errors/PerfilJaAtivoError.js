const DomainError = require('./DomainError');

class PerfilJaAtivoError extends DomainError {
  static CODIGO = 'PERFIL_JA_ATIVO';

  /**
   * @param {number|string} [perfilId]
   */
  constructor(perfilId) {
    super('Perfil comercial já está ativo', {
      codigo: PerfilJaAtivoError.CODIGO,
      detalhes: { perfilId }
    });
  }
}

module.exports = PerfilJaAtivoError;
