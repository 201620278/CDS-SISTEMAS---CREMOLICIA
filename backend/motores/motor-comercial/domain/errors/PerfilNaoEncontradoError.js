const DomainError = require('./DomainError');

class PerfilNaoEncontradoError extends DomainError {
  static CODIGO = 'PERFIL_NAO_ENCONTRADO';

  /**
   * @param {number|string} [perfilId]
   */
  constructor(perfilId) {
    super(
      perfilId != null
        ? `Perfil comercial não encontrado: ${perfilId}`
        : 'Perfil comercial não encontrado',
      { codigo: PerfilNaoEncontradoError.CODIGO, detalhes: { perfilId } }
    );
  }
}

module.exports = PerfilNaoEncontradoError;
