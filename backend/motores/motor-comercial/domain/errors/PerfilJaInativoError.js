const DomainError = require('./DomainError');

class PerfilJaInativoError extends DomainError {
  static CODIGO = 'PERFIL_JA_INATIVO';

  /**
   * @param {number|string} [perfilId]
   */
  constructor(perfilId) {
    super('Perfil comercial já está inativo', {
      codigo: PerfilJaInativoError.CODIGO,
      detalhes: { perfilId }
    });
  }
}

module.exports = PerfilJaInativoError;
