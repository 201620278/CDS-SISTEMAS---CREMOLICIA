const DomainError = require('./DomainError');

class PerfilDuplicadoError extends DomainError {
  static CODIGO = 'PERFIL_DUPLICADO';

  /**
   * @param {number|string} clienteId
   * @param {string} perfilTipo
   */
  constructor(clienteId, perfilTipo) {
    super('Perfil comercial já existe para este cliente e tipo', {
      codigo: PerfilDuplicadoError.CODIGO,
      detalhes: { clienteId, perfilTipo }
    });
  }
}

module.exports = PerfilDuplicadoError;
