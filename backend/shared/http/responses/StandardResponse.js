/**
 * StandardResponse — Resposta HTTP padronizada para toda plataforma CDS.
 *
 * Sprint 2.5.5: Hardening da API — resposta corporativa.
 *
 * @module backend/shared/http/responses/StandardResponse
 */

class StandardResponse {
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
      requestId: null, // Preenchido pelo middleware
      correlationId: null, // Preenchido pelo middleware
      timestamp: new Date().toISOString(),
      version: '1.0',
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
      requestId: null, // Preenchido pelo middleware
      correlationId: null, // Preenchido pelo middleware
      timestamp: new Date().toISOString(),
      version: '1.0',
      error: {
        code,
        message,
        details: details || {}
      },
      metadata: {},
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
    return this.error(
      code,
      domainError.message,
      domainError.detalhes || null,
      statusCode
    );
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
   * Cria uma resposta de limite excedido (rate limit).
   * @param {string} message - Mensagem de erro
   * @param {Object} [details] - Detalhes adicionais
   * @returns {Object}
   */
  static tooManyRequests(message = 'Limite de requisições excedido', details = null) {
    return this.error('TOO_MANY_REQUESTS', message, details, 429);
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

  /**
   * Enriches a response with request metadata.
   * @param {Object} response - Resposta HTTP
   * @param {Object} req - Objeto de requisição Express
   * @returns {Object}
   */
  static enrich(response, req) {
    if (req.requestId) {
      response.requestId = req.requestId;
    }
    if (req.correlationId) {
      response.correlationId = req.correlationId;
    }
    return response;
  }
}

module.exports = StandardResponse;
