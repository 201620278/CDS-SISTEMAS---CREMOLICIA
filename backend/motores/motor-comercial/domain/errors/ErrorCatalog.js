/**
 * ErrorCatalog — Catálogo de erros padronizados do Motor Comercial.
 *
 * Sprint 2.5.5: Hardening da API — catálogo de erros corporativo.
 *
 * @module motores/motor-comercial/domain/errors/ErrorCatalog
 */

class ErrorCatalog {
  // ============================================================================
  // ERROS DE PERFIL COMERCIAL (COMERCIAL-001 a COMERCIAL-099)
  // ============================================================================

  static PERFIL_NAO_ENCONTRADO = 'COMERCIAL-001';
  static PERFIL_DUPLICADO = 'COMERCIAL-002';
  static PERFIL_BLOQUEADO = 'COMERCIAL-003';
  static PERFIL_SEM_LIMITE_DISPONIVEL = 'COMERCIAL-004';
  static PERFIL_INATIVO = 'COMERCIAL-005';
  static PERFIL_TIPO_INVALIDO = 'COMERCIAL-006';
  static PERFIL_LIMITE_NEGATIVO = 'COMERCIAL-007';
  static PERFIL_LIMITE_EXCEDIDO = 'COMERCIAL-008';
  static PERFIL_JA_BLOQUEADO = 'COMERCIAL-009';
  static PERFIL_JA_DESBLOQUEADO = 'COMERCIAL-010';

  // ============================================================================
  // ERROS DE CONSIGNAÇÃO (COMERCIAL-100 a COMERCIAL-199)
  // ============================================================================

  static CONSIGNACAO_NAO_ENCONTRADA = 'COMERCIAL-100';
  static CONSIGNACAO_DUPLICADA = 'COMERCIAL-101';
  static CONSIGNACAO_NAO_ESTA_EM_RASCUNHO = 'COMERCIAL-102';
  static CONSIGNACAO_JA_CANCELADA = 'COMERCIAL-103';
  static CONSIGNACAO_NAO_ENTREGUE = 'COMERCIAL-104';
  static CONSIGNACAO_JA_ENTREGUE = 'COMERCIAL-105';
  static CONSIGNACAO_EM_PRESTACAO = 'COMERCIAL-106';
  static CONSIGNACAO_FECHADA = 'COMERCIAL-107';
  static DOCUMENTO_DUPLICADO = 'COMERCIAL-108';
  static DOCUMENTO_INVALIDO = 'COMERCIAL-109';

  // ============================================================================
  // ERROS DE ITENS DE CONSIGNAÇÃO (COMERCIAL-200 a COMERCIAL-299)
  // ============================================================================

  static ITEM_NAO_ENCONTRADO = 'COMERCIAL-200';
  static ITEM_DUPLICADO = 'COMERCIAL-201';
  static QUANTIDADE_INVALIDA = 'COMERCIAL-202';
  static QUANTIDADE_SUPERIOR_AO_SALDO = 'COMERCIAL-203';
  static ITEM_NAO_PERTENCE_A_CONSIGNACAO = 'COMERCIAL-204';
  static PRODUTO_NAO_ENCONTRADO = 'COMERCIAL-205';
  static PRECO_UNITARIO_INVALIDO = 'COMERCIAL-206';

  // ============================================================================
  // ERROS DE PRESTAÇÃO (COMERCIAL-300 a COMERCIAL-399)
  // ============================================================================

  static PRESTACAO_NAO_ABERTA = 'COMERCIAL-300';
  static PRESTACAO_JA_ABERTA = 'COMERCIAL-301';
  static PRESTACAO_JA_FECHADA = 'COMERCIAL-302';
  static PRESTACAO_NAO_FECHADA = 'COMERCIAL-303';
  static PRESTACAO_NAO_EXISTE = 'COMERCIAL-304';
  static PRESTACAO_REABERTURA_NAO_AUTORIZADA = 'COMERCIAL-305';
  static PRESTACAO_SALDO_INEXISTENTE = 'COMERCIAL-306';

  // ============================================================================
  // ERROS DE OPERAÇÕES DE PRESTAÇÃO (COMERCIAL-400 a COMERCIAL-499)
  // ============================================================================

  static VENDA_QUANTIDADE_INVALIDA = 'COMERCIAL-400';
  static VENDA_PRECO_INVALIDO = 'COMERCIAL-401';
  static VENDA_SALDO_INSUFICIENTE = 'COMERCIAL-402';
  static PERDA_QUANTIDADE_INVALIDA = 'COMERCIAL-403';
  static PERDA_MOTIVO_OBRIGATORIO = 'COMERCIAL-404';
  static CORTESIA_QUANTIDADE_INVALIDA = 'COMERCIAL-405';
  static CORTESIA_MOTIVO_OBRIGATORIO = 'COMERCIAL-406';
  static PAGAMENTO_VALOR_INVALIDO = 'COMERCIAL-407';
  static PAGAMENTO_MAIOR_QUE_SALDO = 'COMERCIAL-408';
  static PAGAMENTO_FORMA_INVALIDA = 'COMERCIAL-409';

  // ============================================================================
  // ERROS DE TRANSFERÊNCIA (COMERCIAL-500 a COMERCIAL-599)
  // ============================================================================

  static TRANSFERENCIA_INVALIDA = 'COMERCIAL-500';
  static TRANSFERENCIA_MESMA_CONSIGNACAO = 'COMERCIAL-501';
  static TRANSFERENCIA_ORIGEM_NAO_ENCONTRADA = 'COMERCIAL-502';
  static TRANSFERENCIA_DESTINO_NAO_ENCONTRADA = 'COMERCIAL-503';
  static TRANSFERENCIA_STATUS_INVALIDO = 'COMERCIAL-504';
  static TRANSFERENCIA_ITEM_NAO_ENCONTRADO = 'COMERCIAL-505';

  // ============================================================================
  // ERROS DE ENTREGA E DEVOLUÇÃO (COMERCIAL-600 a COMERCIAL-699)
  // ============================================================================

  static ENTREGA_JA_REALIZADA = 'COMERCIAL-600';
  static ENTREGA_NAO_PERMITIDA = 'COMERCIAL-601';
  static DEVOLUCAO_NAO_PERMITIDA = 'COMERCIAL-602';
  static DEVOLUCAO_APOS_PRESTACAO = 'COMERCIAL-603';
  static DEVOLUCAO_JA_REALIZADA = 'COMERCIAL-604';

  // ============================================================================
  // ERROS DE CLIENTE (COMERCIAL-700 a COMERCIAL-799)
  // ============================================================================

  static CLIENTE_NAO_ENCONTRADO = 'COMERCIAL-700';
  static CLIENTE_BLOQUEADO = 'COMERCIAL-701';
  static CLIENTE_INATIVO = 'COMERCIAL-702';
  static CLIENTE_DUPLICADO = 'COMERCIAL-703';

  // ============================================================================
  // ERROS DE VALIDAÇÃO (COMERCIAL-800 a COMERCIAL-899)
  // ============================================================================

  static VALIDACAO_CAMPO_OBRIGATORIO = 'COMERCIAL-800';
  static VALIDACAO_FORMATO_INVALIDO = 'COMERCIAL-801';
  static VALIDACAO_VALOR_INVALIDO = 'COMERCIAL-802';
  static VALIDACAO_TAMANHO_INVALIDO = 'COMERCIAL-803';
  static VALIDACAO_DATA_INVALIDA = 'COMERCIAL-804';

  // ============================================================================
  // ERROS GERAIS (COMERCIAL-900 a COMERCIAL-999)
  // ============================================================================

  static ERRO_INTERNO = 'COMERCIAL-900';
  static ERRO_INTEGRACAO = 'COMERCIAL-901';
  static ERRO_BANCO_DADOS = 'COMERCIAL-902';
  static ERRO_SERVICO_EXTERNO = 'COMERCIAL-903';
  static ERRO_TIMEOUT = 'COMERCIAL-904';

  /**
   * Obtém mensagem de erro a partir do código.
   * @param {string} code - Código do erro
   * @returns {string} - Mensagem do erro
   */
  static getMessage(code) {
    const messages = {
      // Perfil
      [this.PERFIL_NAO_ENCONTRADO]: 'Perfil comercial não encontrado',
      [this.PERFIL_DUPLICADO]: 'Perfil comercial já existe para este cliente',
      [this.PERFIL_BLOQUEADO]: 'Perfil comercial está bloqueado',
      [this.PERFIL_SEM_LIMITE_DISPONIVEL]: 'Perfil comercial não possui limite disponível',
      [this.PERFIL_INATIVO]: 'Perfil comercial está inativo',
      [this.PERFIL_TIPO_INVALIDO]: 'Tipo de perfil inválido',
      [this.PERFIL_LIMITE_NEGATIVO]: 'Limite comercial não pode ser negativo',
      [this.PERFIL_LIMITE_EXCEDIDO]: 'Limite comercial excedido',
      [this.PERFIL_JA_BLOQUEADO]: 'Perfil comercial já está bloqueado',
      [this.PERFIL_JA_DESBLOQUEADO]: 'Perfil comercial já está desbloqueado',

      // Consignação
      [this.CONSIGNACAO_NAO_ENCONTRADA]: 'Consignação não encontrada',
      [this.CONSIGNACAO_DUPLICADA]: 'Consignação duplicada',
      [this.CONSIGNACAO_NAO_ESTA_EM_RASCUNHO]: 'Consignação não está em rascunho',
      [this.CONSIGNACAO_JA_CANCELADA]: 'Consignação já está cancelada',
      [this.CONSIGNACAO_NAO_ENTREGUE]: 'Consignação não foi entregue',
      [this.CONSIGNACAO_JA_ENTREGUE]: 'Consignação já foi entregue',
      [this.CONSIGNACAO_EM_PRESTACAO]: 'Consignação está em prestação',
      [this.CONSIGNACAO_FECHADA]: 'Consignação está fechada',
      [this.DOCUMENTO_DUPLICADO]: 'Documento duplicado',
      [this.DOCUMENTO_INVALIDO]: 'Documento inválido',

      // Itens
      [this.ITEM_NAO_ENCONTRADO]: 'Item não encontrado',
      [this.ITEM_DUPLICADO]: 'Item duplicado',
      [this.QUANTIDADE_INVALIDA]: 'Quantidade inválida',
      [this.QUANTIDADE_SUPERIOR_AO_SALDO]: 'Quantidade superior ao saldo disponível',
      [this.ITEM_NAO_PERTENCE_A_CONSIGNACAO]: 'Item não pertence à consignação',
      [this.PRODUTO_NAO_ENCONTRADO]: 'Produto não encontrado',
      [this.PRECO_UNITARIO_INVALIDO]: 'Preço unitário inválido',

      // Prestação
      [this.PRESTACAO_NAO_ABERTA]: 'Prestação não está aberta',
      [this.PRESTACAO_JA_ABERTA]: 'Prestação já está aberta',
      [this.PRESTACAO_JA_FECHADA]: 'Prestação já está fechada',
      [this.PRESTACAO_NAO_FECHADA]: 'Prestação não está fechada',
      [this.PRESTACAO_NAO_EXISTE]: 'Prestação não existe',
      [this.PRESTACAO_REABERTURA_NAO_AUTORIZADA]: 'Reabertura de prestação não autorizada',
      [this.PRESTACAO_SALDO_INEXISTENTE]: 'Saldo de prestação inexistente',

      // Operações de prestação
      [this.VENDA_QUANTIDADE_INVALIDA]: 'Quantidade de venda inválida',
      [this.VENDA_PRECO_INVALIDO]: 'Preço de venda inválido',
      [this.VENDA_SALDO_INSUFICIENTE]: 'Saldo insuficiente para venda',
      [this.PERDA_QUANTIDADE_INVALIDA]: 'Quantidade de perda inválida',
      [this.PERDA_MOTIVO_OBRIGATORIO]: 'Motivo da perda é obrigatório',
      [this.CORTESIA_QUANTIDADE_INVALIDA]: 'Quantidade de cortesia inválida',
      [this.CORTESIA_MOTIVO_OBRIGATORIO]: 'Motivo da cortesia é obrigatório',
      [this.PAGAMENTO_VALOR_INVALIDO]: 'Valor de pagamento inválido',
      [this.PAGAMENTO_MAIOR_QUE_SALDO]: 'Pagamento maior que saldo',
      [this.PAGAMENTO_FORMA_INVALIDA]: 'Forma de pagamento inválida',

      // Transferência
      [this.TRANSFERENCIA_INVALIDA]: 'Transferência inválida',
      [this.TRANSFERENCIA_MESMA_CONSIGNACAO]: 'Não é possível transferir para a mesma consignação',
      [this.TRANSFERENCIA_ORIGEM_NAO_ENCONTRADA]: 'Consignação de origem não encontrada',
      [this.TRANSFERENCIA_DESTINO_NAO_ENCONTRADA]: 'Consignação de destino não encontrada',
      [this.TRANSFERENCIA_STATUS_INVALIDO]: 'Status da consignação não permite transferência',
      [this.TRANSFERENCIA_ITEM_NAO_ENCONTRADO]: 'Item não encontrado para transferência',

      // Entrega e devolução
      [this.ENTREGA_JA_REALIZADA]: 'Entrega já realizada',
      [this.ENTREGA_NAO_PERMITIDA]: 'Entrega não permitida',
      [this.DEVOLUCAO_NAO_PERMITIDA]: 'Devolução não permitida',
      [this.DEVOLUCAO_APOS_PRESTACAO]: 'Devolução após prestação não permitida',
      [this.DEVOLUCAO_JA_REALIZADA]: 'Devolução já realizada',

      // Cliente
      [this.CLIENTE_NAO_ENCONTRADO]: 'Cliente não encontrado',
      [this.CLIENTE_BLOQUEADO]: 'Cliente está bloqueado',
      [this.CLIENTE_INATIVO]: 'Cliente está inativo',
      [this.CLIENTE_DUPLICADO]: 'Cliente duplicado',

      // Validação
      [this.VALIDACAO_CAMPO_OBRIGATORIO]: 'Campo obrigatório ausente',
      [this.VALIDACAO_FORMATO_INVALIDO]: 'Formato inválido',
      [this.VALIDACAO_VALOR_INVALIDO]: 'Valor inválido',
      [this.VALIDACAO_TAMANHO_INVALIDO]: 'Tamanho inválido',
      [this.VALIDACAO_DATA_INVALIDA]: 'Data inválida',

      // Gerais
      [this.ERRO_INTERNO]: 'Erro interno do servidor',
      [this.ERRO_INTEGRACAO]: 'Erro de integração',
      [this.ERRO_BANCO_DADOS]: 'Erro de banco de dados',
      [this.ERRO_SERVICO_EXTERNO]: 'Erro de serviço externo',
      [this.ERRO_TIMEOUT]: 'Timeout da operação'
    };

    return messages[code] || 'Erro desconhecido';
  }

  /**
   * Obtém código HTTP a partir do código de erro.
   * @param {string} code - Código do erro
   * @returns {number} - Código HTTP
   */
  static getHttpStatusCode(code) {
    const statusMap = {
      // 400 Bad Request
      [this.PERFIL_SEM_LIMITE_DISPONIVEL]: 400,
      [this.PERFIL_TIPO_INVALIDO]: 400,
      [this.PERFIL_LIMITE_NEGATIVO]: 400,
      [this.PERFIL_LIMITE_EXCEDIDO]: 400,
      [this.CONSIGNACAO_NAO_ESTA_EM_RASCUNHO]: 400,
      [this.DOCUMENTO_INVALIDO]: 400,
      [this.QUANTIDADE_INVALIDA]: 400,
      [this.QUANTIDADE_SUPERIOR_AO_SALDO]: 400,
      [this.PRECO_UNITARIO_INVALIDO]: 400,
      [this.PRESTACAO_NAO_ABERTA]: 400,
      [this.PRESTACAO_JA_ABERTA]: 400,
      [this.PRESTACAO_NAO_FECHADA]: 400,
      [this.VENDA_QUANTIDADE_INVALIDA]: 400,
      [this.VENDA_PRECO_INVALIDO]: 400,
      [this.VENDA_SALDO_INSUFICIENTE]: 400,
      [this.PERDA_QUANTIDADE_INVALIDA]: 400,
      [this.PERDA_MOTIVO_OBRIGATORIO]: 400,
      [this.CORTESIA_QUANTIDADE_INVALIDA]: 400,
      [this.CORTESIA_MOTIVO_OBRIGATORIO]: 400,
      [this.PAGAMENTO_VALOR_INVALIDO]: 400,
      [this.PAGAMENTO_MAIOR_QUE_SALDO]: 400,
      [this.PAGAMENTO_FORMA_INVALIDA]: 400,
      [this.TRANSFERENCIA_INVALIDA]: 400,
      [this.TRANSFERENCIA_MESMA_CONSIGNACAO]: 400,
      [this.TRANSFERENCIA_STATUS_INVALIDO]: 400,
      [this.ENTREGA_NAO_PERMITIDA]: 400,
      [this.DEVOLUCAO_NAO_PERMITIDA]: 400,
      [this.DEVOLUCAO_APOS_PRESTACAO]: 400,
      [this.VALIDACAO_CAMPO_OBRIGATORIO]: 400,
      [this.VALIDACAO_FORMATO_INVALIDO]: 400,
      [this.VALIDACAO_VALOR_INVALIDO]: 400,
      [this.VALIDACAO_TAMANHO_INVALIDO]: 400,
      [this.VALIDACAO_DATA_INVALIDA]: 400,

      // 401 Unauthorized
      [this.ERRO_INTEGRACAO]: 401,

      // 403 Forbidden
      [this.PERFIL_BLOQUEADO]: 403,
      [this.CLIENTE_BLOQUEADO]: 403,
      [this.PRESTACAO_REABERTURA_NAO_AUTORIZADA]: 403,

      // 404 Not Found
      [this.PERFIL_NAO_ENCONTRADO]: 404,
      [this.CONSIGNACAO_NAO_ENCONTRADA]: 404,
      [this.ITEM_NAO_ENCONTRADO]: 404,
      [this.PRODUTO_NAO_ENCONTRADO]: 404,
      [this.PRESTACAO_NAO_EXISTE]: 404,
      [this.TRANSFERENCIA_ORIGEM_NAO_ENCONTRADA]: 404,
      [this.TRANSFERENCIA_DESTINO_NAO_ENCONTRADA]: 404,
      [this.TRANSFERENCIA_ITEM_NAO_ENCONTRADO]: 404,
      [this.CLIENTE_NAO_ENCONTRADO]: 404,

      // 409 Conflict
      [this.PERFIL_DUPLICADO]: 409,
      [this.CONSIGNACAO_DUPLICADA]: 409,
      [this.ITEM_DUPLICADO]: 409,
      [this.DOCUMENTO_DUPLICADO]: 409,
      [this.CLIENTE_DUPLICADO]: 409,
      [this.PERFIL_JA_BLOQUEADO]: 409,
      [this.PERFIL_JA_DESBLOQUEADO]: 409,
      [this.CONSIGNACAO_JA_CANCELADA]: 409,
      [this.CONSIGNACAO_JA_ENTREGUE]: 409,
      [this.PRESTACAO_JA_ABERTA]: 409,
      [this.PRESTACAO_JA_FECHADA]: 409,
      [this.ENTREGA_JA_REALIZADA]: 409,
      [this.DEVOLUCAO_JA_REALIZADA]: 409,

      // 500 Internal Server Error
      [this.ERRO_INTERNO]: 500,
      [this.ERRO_BANCO_DADOS]: 500,
      [this.ERRO_SERVICO_EXTERNO]: 500,
      [this.ERRO_TIMEOUT]: 500
    };

    return statusMap[code] || 400;
  }

  /**
   * Lista todos os códigos de erro.
   * @returns {Array<string>}
   */
  static getAllCodes() {
    return Object.values(ErrorCatalog).filter(value => typeof value === 'string' && value.startsWith('COMERCIAL-'));
  }
}

module.exports = ErrorCatalog;
