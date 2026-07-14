const DomainError = require('./DomainError');

class OperacaoNaoAutorizadaError extends DomainError {
  static CODIGO = 'OPERACAO_NAO_AUTORIZADA';

  /**
   * @param {string} [permissao]
   * @param {string} [mensagem]
   */
  constructor(permissao = null, mensagem = 'Operação não autorizada') {
    super(mensagem, {
      codigo: OperacaoNaoAutorizadaError.CODIGO,
      detalhes: permissao ? { permissao } : null
    });
  }
}

module.exports = OperacaoNaoAutorizadaError;
