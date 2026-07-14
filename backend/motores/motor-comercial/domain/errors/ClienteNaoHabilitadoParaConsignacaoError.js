const DomainError = require('./DomainError');

class ClienteNaoHabilitadoParaConsignacaoError extends DomainError {
  static CODIGO = 'CLIENTE_NAO_HABILITADO_PARA_CONSIGNACAO';

  /**
   * @param {Object} [detalhes]
   */
  constructor(detalhes = {}) {
    super('Cliente não habilitado para consignação', {
      codigo: ClienteNaoHabilitadoParaConsignacaoError.CODIGO,
      detalhes
    });
  }
}

module.exports = ClienteNaoHabilitadoParaConsignacaoError;
