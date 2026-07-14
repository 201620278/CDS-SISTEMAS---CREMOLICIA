/**
 * HttpAuditService — Serviço de auditoria HTTP.
 *
 * Sprint 2.5.5: Hardening da API — serviço de auditoria HTTP.
 *
 * @module backend/shared/http/audit/HttpAuditService
 */

const InMemoryHttpAuditStore = require('./InMemoryHttpAuditStore');

class HttpAuditService {
  /**
   * Cria serviço de auditoria HTTP.
   * @param {Object} [options]
   * @param {IHttpAuditStore} [options.store] - Armazenamento de auditoria
   * @param {boolean} [options.enabled] - Habilita auditoria (padrão: true)
   * @param {boolean} [options.logRequestBody] - Log corpo da requisição (padrão: false)
   * @param {boolean} [options.logResponseBody] - Log corpo da resposta (padrão: false)
   * @param {Array<string>} [options.sensitiveHeaders] - Headers sensíveis para ocultar
   * @returns {HttpAuditService}
   */
  static create(options = {}) {
    const store = options.store || new InMemoryHttpAuditStore();
    const enabled = options.enabled !== undefined ? options.enabled : true;
    const logRequestBody = options.logRequestBody || false;
    const logResponseBody = options.logResponseBody || false;
    const sensitiveHeaders = options.sensitiveHeaders || ['authorization', 'cookie', 'x-api-key'];

    return new HttpAuditService({
      store,
      enabled,
      logRequestBody,
      logResponseBody,
      sensitiveHeaders
    });
  }

  constructor(options) {
    this._store = options.store;
    this._enabled = options.enabled;
    this._logRequestBody = options.logRequestBody;
    this._logResponseBody = options.logResponseBody;
    this._sensitiveHeaders = options.sensitiveHeaders.map(h => h.toLowerCase());
  }

  /**
   * Registra uma requisição HTTP.
   * @param {Object} req - Objeto da requisição Express
   * @param {Object} res - Objeto da resposta Express
   * @param {number} duration - Duração em milissegundos
   * @returns {Promise<void>}
   */
  async audit(req, res, duration) {
    if (!this._enabled) {
      return;
    }

    const auditRecord = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      correlationId: req.correlationId,
      usuarioId: req.usuarioId || req.user?.id || null,
      method: req.method,
      path: req.path,
      query: this._sanitizeQuery(req.query),
      headers: this._sanitizeHeaders(req.headers),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      statusCode: res.statusCode,
      duration,
      requestBody: this._logRequestBody ? this._sanitizeBody(req.body) : undefined,
      responseBody: this._logResponseBody ? this._sanitizeBody(res.body) : undefined
    };

    await this._store.store(auditRecord);
  }

  /**
   * Busca registros por requestId.
   * @param {string} requestId - ID da requisição
   * @returns {Promise<Object|null>}
   */
  async findByRequestId(requestId) {
    return await this._store.findByRequestId(requestId);
  }

  /**
   * Busca registros por correlationId.
   * @param {string} correlationId - ID de correlação
   * @returns {Promise<Array>}
   */
  async findByCorrelationId(correlationId) {
    return await this._store.findByCorrelationId(correlationId);
  }

  /**
   * Busca registros por usuário.
   * @param {string} usuarioId - ID do usuário
   * @param {Object} [options] - Opções de busca
   * @returns {Promise<Array>}
   */
  async findByUsuario(usuarioId, options = {}) {
    return await this._store.findByUsuario(usuarioId, options);
  }

  /**
   * Busca registros por filtros.
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Array>}
   */
  async findByFilters(filters) {
    return await this._store.findByFilters(filters);
  }

  /**
   * Remove registros antigos.
   * @param {Date} beforeDate - Data limite
   * @returns {Promise<number>}
   */
  async cleanup(beforeDate) {
    return await this._store.cleanup(beforeDate);
  }

  /**
   * Limpa todo o armazenamento.
   * @returns {Promise<void>}
   */
  async clear() {
    await this._store.clear();
  }

  /**
   * Retorna o tamanho do armazenamento.
   * @returns {number}
   */
  size() {
    return this._store.size();
  }

  /**
   * Sanitiza headers sensíveis.
   * @private
   */
  _sanitizeHeaders(headers) {
    const sanitized = {};
    for (const [key, value] of Object.entries(headers)) {
      if (this._sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Sanitiza query params.
   * @private
   */
  _sanitizeQuery(query) {
    const sanitized = {};
    for (const [key, value] of Object.entries(query)) {
      if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
        sanitized[key] = '***REDACTED***';
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Sanitiza corpo da requisição/resposta.
   * @private
   */
  _sanitizeBody(body) {
    if (!body) {
      return undefined;
    }

    if (typeof body === 'string') {
      return body;
    }

    const sanitized = JSON.parse(JSON.stringify(body));
    const redact = (obj) => {
      for (const key in obj) {
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret')) {
          obj[key] = '***REDACTED***';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          redact(obj[key]);
        }
      }
    };

    redact(sanitized);
    return sanitized;
  }

  /**
   * Gera um ID único.
   * @private
   */
  _generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = HttpAuditService;
