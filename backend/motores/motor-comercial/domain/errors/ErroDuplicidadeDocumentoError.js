const DomainError = require('./DomainError');

class ErroDuplicidadeDocumentoError extends DomainError {
  static CODIGO = 'DOCUMENTO_DUPLICADO';

  /**
   * @param {Object} [documento]
   */
  constructor(documento = {}) {
    super('Documento comercial duplicado', {
      codigo: ErroDuplicidadeDocumentoError.CODIGO,
      detalhes: { documento }
    });
  }
}

module.exports = ErroDuplicidadeDocumentoError;
