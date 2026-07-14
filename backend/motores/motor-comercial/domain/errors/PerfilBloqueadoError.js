const DomainError = require('./DomainError');

class PerfilBloqueadoError extends DomainError {
  static CODIGO = 'PERFIL_BLOQUEADO';

  /**
   * @param {number|string} [perfilId]
   * @param {string} [motivo]
   */
  constructor(perfilId, motivo) {
    super('Perfil comercial bloqueado', {
      codigo: PerfilBloqueadoError.CODIGO,
      detalhes: { perfilId, motivo }
    });
  }
}

module.exports = PerfilBloqueadoError;
