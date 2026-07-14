/**
 * DomainErrorMapper — Converte erros de domínio em respostas HTTP (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — mapeamento de erros.
 *
 * @module backend/shared/http/mappers/DomainErrorMapper
 */

const StandardResponse = require('../responses/StandardResponse');

class DomainErrorMapper {
  /**
   * Mapeia erros de domínio para respostas HTTP.
   * @param {Error} error - Erro a ser mapeado
   * @returns {Object}
   */
  static map(error) {
    if (error?.isInfrastructure || error?.codigo === 'INFRASTRUCTURE_ERROR') {
      return StandardResponse.error(
        'INFRASTRUCTURE_ERROR',
        error.message,
        error.detalhes || null,
        503
      );
    }

    // Se já for um DomainError
    if (error.name && error.codigo) {
      return StandardResponse.domainError(error);
    }

    // Erros de validação comuns
    if (error.message.includes('é obrigatório') || 
        error.message.includes('obrigatório')) {
      return StandardResponse.validationError(error.message);
    }

    // Erros de não encontrado
    if (error.message.includes('não encontrado') || 
        error.message.includes('not found')) {
      return StandardResponse.notFound(error.message);
    }

    // Erros de duplicidade
    if (error.message.includes('duplicado') || 
        error.message.includes('já existe')) {
      return StandardResponse.conflict(error.message);
    }

    // Erro genérico
    return StandardResponse.internalError(error.message);
  }

  /**
   * Mapeia códigos de erro específicos para status HTTP.
   * @param {string} errorCode - Código do erro
   * @returns {number}
   */
  static mapToStatusCode(errorCode) {
    const statusCodeMap = {
      'VALIDATION_ERROR': 400,
      'NOT_FOUND': 404,
      'CONFLICT': 409,
      'UNAUTHORIZED': 401,
      'FORBIDDEN': 403,
      'TOO_MANY_REQUESTS': 429,
      'PERFIL_NAO_ENCONTRADO': 404,
      'CONSIGNACAO_NAO_ENCONTRADA': 404,
      'CLIENTE_NAO_ENCONTRADO': 404,
      'PERFIL_DUPLICADO': 409,
      'DOCUMENTO_DUPLICADO': 409,
      'PERFIL_BLOQUEADO': 403,
      'CLIENTE_BLOQUEADO': 403,
      'LIMITE_COMERCIAL_INSUFICIENTE': 400,
      'PERFIL_SEM_LIMITE_DISPONIVEL': 400,
      'MOVIMENTACAO_INVALIDA': 400,
      'QUANTIDADE_INVALIDA': 400,
      'QUANTIDADE_SUPERIOR_AO_SALDO': 400,
      'PAGAMENTO_MAIOR_QUE_SALDO': 400,
      'PRESTACAO_JA_FECHADA': 400,
      'PRESTACAO_NAO_ABERTA': 400,
      'PRESTACAO_JA_ABERTA': 400,
      'CONSIGNACAO_NAO_ENTREGUE': 400,
      'ENTREGA_JA_REALIZADA': 400,
      'CONSIGNACAO_NAO_ESTA_EM_RASCUNHO': 400,
      'TRANSFERENCIA_INVALIDA': 400,
      'REABERTURA_NAO_AUTORIZADA': 403,
      'OPERACAO_NAO_AUTORIZADA': 403
    };

    return statusCodeMap[errorCode] || 400;
  }
}

module.exports = DomainErrorMapper;
