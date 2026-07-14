const DomainError = require('./DomainError');

class DocumentoInvalidoError extends DomainError {
  static CODIGO = 'DOCUMENTO_INVALIDO';

  /**
   * @param {string} [motivo]
   * @param {Object} [detalhes]
   */
  constructor(motivo, detalhes = {}) {
    super(motivo || 'Documento comercial inválido', {
      codigo: DocumentoInvalidoError.CODIGO,
      detalhes
    });
  }
}

module.exports = DocumentoInvalidoError;
