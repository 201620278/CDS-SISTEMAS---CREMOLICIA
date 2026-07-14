/**
 * HttpResponse — Resposta HTTP padronizada do Motor Comercial.
 *
 * Sprint 2.5: API REST — padronização de respostas.
 *
 * @module motores/motor-comercial/http/responses/HttpResponse
 */

class HttpResponse {
  /**
   * Cria uma resposta de sucesso.
   * @param {Object} data - Dados da resposta
   * @param {Object} [metadata] - Metadados adicionais
   * @param {number} [statusCode=200] - Código HTTP
   * @returns {Object}
   */
  static success(data, metadata = null, statusCode = 200) {
    return {
      success: true,
      data,
      metadata: metadata || {},
      _statusCode: statusCode
    };
  }

  /**
   * Cria uma resposta de erro.
   * @param {string} code - Código do erro
   * @param {string} message - Mensagem de erro
   * @param {Object} [details] - Detalhes adicionais
   * @param {number} [statusCode=400] - Código HTTP
   * @returns {Object}
   */
  static error(code, message, details = null, statusCode = 400) {
    return {
      success: false,
      error: {
        code,
        message,
        details: details || {}
      },
      _statusCode: statusCode
    };
  }

  /**
   * Cria uma resposta de erro de validação.
   * @param {string} message - Mensagem de erro
   * @param {Object} [details] - Detalhes dos campos inválidos
   * @returns {Object}
   */
  static validationError(message, details = null) {
    return this.error('VALIDATION_ERROR', message, details, 400);
  }

  /**
   * Cria uma resposta de recurso não encontrado.
   * @param {string} message - Mensagem de erro
   * @param {Object} [details] - Detalhes adicionais
   * @returns {Object}
   */
  static notFound(message, details = null) {
    return this.error('NOT_FOUND', message, details, 404);
  }

  /**
   * Cria uma resposta de erro de domínio.
   * @param {Object} domainError - Erro de domínio
   * @returns {Object}
   */
  static domainError(domainError) {
    const DomainErrorMapper = require('../mappers/DomainErrorMapper');
    const code = domainError.codigo || 'DOMAIN_ERROR';
    const statusCode = DomainErrorMapper.mapToStatusCode(code);
    const detalhes = domainError.detalhes || {};
    const detail = detalhes.detail
      || detalhes.mensagem
      || domainError.message;
    const rule = detalhes.rule
      || code;
    const payload = detalhes.payload || detalhes;

    return {
      success: false,
      code,
      message: domainError.message,
      detail,
      rule,
      payload,
      error: {
        code,
        message: domainError.message,
        details: detalhes
      },
      _statusCode: statusCode
    };
  }

  /**
   * Cria uma resposta de erro interno do servidor.
   * @param {string} message - Mensagem de erro
   * @param {Object} [details] - Detalhes adicionais
   * @returns {Object}
   */
  static internalError(message, details = null) {
    return this.error('INTERNAL_ERROR', message, details, 500);
  }

  /**
   * Cria uma resposta de não autorizado.
   * @param {string} message - Mensagem de erro
   * @returns {Object}
   */
  static unauthorized(message = 'Não autorizado') {
    return this.error('UNAUTHORIZED', message, null, 401);
  }

  /**
   * Cria uma resposta de acesso proibido.
   * @param {string} message - Mensagem de erro
   * @returns {Object}
   */
  static forbidden(message = 'Acesso proibido') {
    return this.error('FORBIDDEN', message, null, 403);
  }

  /**
   * Cria uma resposta de conflito.
   * @param {string} message - Mensagem de erro
   * @param {Object} [details] - Detalhes adicionais
   * @returns {Object}
   */
  static conflict(message, details = null) {
    return this.error('CONFLICT', message, details, 409);
  }

  /**
   * Extrai o código HTTP de uma resposta.
   * @param {Object} response - Resposta HTTP
   * @returns {number}
   */
  static getStatusCode(response) {
    return response._statusCode || (response.success ? 200 : 400);
  }

  /**
   * Remove o código HTTP interno antes de enviar a resposta.
   * @param {Object} response - Resposta HTTP
   * @returns {Object}
   */
  static sanitize(response) {
    const { _statusCode, ...sanitized } = response;
    return sanitized;
  }
}

module.exports = HttpResponse;
