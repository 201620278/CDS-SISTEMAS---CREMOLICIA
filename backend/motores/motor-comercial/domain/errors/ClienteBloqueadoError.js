const DomainError = require('./DomainError');

class ClienteBloqueadoError extends DomainError {
  static CODIGO = 'CLIENTE_BLOQUEADO';

  /**
   * @param {number|string} [clienteId]
   * @param {string} [motivo]
   */
  constructor(clienteId, motivo) {
    super('Cliente bloqueado para operações comerciais', {
      codigo: ClienteBloqueadoError.CODIGO,
      detalhes: { clienteId, motivo }
    });
  }
}

module.exports = ClienteBloqueadoError;
