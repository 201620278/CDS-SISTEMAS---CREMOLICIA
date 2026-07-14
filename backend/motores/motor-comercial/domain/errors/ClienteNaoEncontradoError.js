const DomainError = require('./DomainError');

class ClienteNaoEncontradoError extends DomainError {
  static CODIGO = 'CLIENTE_NAO_ENCONTRADO';

  /**
   * @param {number|string} [clienteId]
   */
  constructor(clienteId) {
    super(
      clienteId != null ? `Cliente não encontrado: ${clienteId}` : 'Cliente não encontrado',
      { codigo: ClienteNaoEncontradoError.CODIGO, detalhes: { clienteId } }
    );
  }
}

module.exports = ClienteNaoEncontradoError;
