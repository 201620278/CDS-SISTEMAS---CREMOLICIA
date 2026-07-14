const DomainError = require('./DomainError');

class DocumentoDuplicadoError extends DomainError {
  static CODIGO = 'DOCUMENTO_DUPLICADO';

  /**
   * @param {Object} [documento]
   */
  constructor(documento = {}) {
    super('Documento comercial duplicado', {
      codigo: DocumentoDuplicadoError.CODIGO,
      detalhes: { documento }
    });
  }
}

module.exports = DocumentoDuplicadoError;
