/**
 * InMemoryHttpAuditStore — Implementação em memória do IHttpAuditStore.
 *
 * Sprint 2.5.5: Hardening da API — armazenamento em memória para auditoria HTTP.
 *
 * @module backend/shared/http/audit/InMemoryHttpAuditStore
 */

const IHttpAuditStore = require('./IHttpAuditStore');

class InMemoryHttpAuditStore extends IHttpAuditStore {
  constructor() {
    super();
    this._records = new Map();
    this._byRequestId = new Map();
    this._byCorrelationId = new Map();
    this._byUsuario = new Map();
  }

  /**
   * Armazena um registro de auditoria.
   * @param {Object} auditRecord - Registro de auditoria
   * @returns {Promise<void>}
   */
  async store(auditRecord) {
    const id = auditRecord.id || this._generateId();
    const record = { ...auditRecord, id };

    this._records.set(id, record);

    if (record.requestId) {
      this._byRequestId.set(record.requestId, record);
    }

    if (record.correlationId) {
      if (!this._byCorrelationId.has(record.correlationId)) {
        this._byCorrelationId.set(record.correlationId, []);
      }
      this._byCorrelationId.get(record.correlationId).push(record);
    }

    if (record.usuarioId) {
      if (!this._byUsuario.has(record.usuarioId)) {
        this._byUsuario.set(record.usuarioId, []);
      }
      this._byUsuario.get(record.usuarioId).push(record);
    }
  }

  /**
   * Busca registros de auditoria por filtros.
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Array>}
   */
  async findByFilters(filters = {}) {
    let results = Array.from(this._records.values());

    if (filters.requestId) {
      results = results.filter(r => r.requestId === filters.requestId);
    }

    if (filters.correlationId) {
      results = results.filter(r => r.correlationId === filters.correlationId);
    }

    if (filters.usuarioId) {
      results = results.filter(r => r.usuarioId === filters.usuarioId);
    }

    if (filters.method) {
      results = results.filter(r => r.method === filters.method);
    }

    if (filters.path) {
      results = results.filter(r => r.path === filters.path);
    }

    if (filters.statusCode) {
      results = results.filter(r => r.statusCode === filters.statusCode);
    }

    if (filters.startDate) {
      results = results.filter(r => new Date(r.timestamp) >= filters.startDate);
    }

    if (filters.endDate) {
      results = results.filter(r => new Date(r.timestamp) <= filters.endDate);
    }

    // Ordena por timestamp decrescente
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginação
    if (filters.offset) {
      results = results.slice(filters.offset);
    }

    if (filters.limit) {
      results = results.slice(0, filters.limit);
    }

    return results;
  }

  /**
   * Busca registro por requestId.
   * @param {string} requestId - ID da requisição
   * @returns {Promise<Object|null>}
   */
  async findByRequestId(requestId) {
    return this._byRequestId.get(requestId) || null;
  }

  /**
   * Busca registros por correlationId.
   * @param {string} correlationId - ID de correlação
   * @returns {Promise<Array>}
   */
  async findByCorrelationId(correlationId) {
    return this._byCorrelationId.get(correlationId) || [];
  }

  /**
   * Busca registros por usuário.
   * @param {string} usuarioId - ID do usuário
   * @param {Object} [options] - Opções de busca
   * @returns {Promise<Array>}
   */
  async findByUsuario(usuarioId, options = {}) {
    let results = this._byUsuario.get(usuarioId) || [];

    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (options.offset) {
      results = results.slice(options.offset);
    }

    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Remove registros antigos (cleanup).
   * @param {Date} beforeDate - Data limite para remoção
   * @returns {Promise<number>} - Número de registros removidos
   */
  async cleanup(beforeDate) {
    let removed = 0;

    for (const [id, record] of this._records.entries()) {
      if (new Date(record.timestamp) < beforeDate) {
        this._records.delete(id);
        
        if (record.requestId) {
          this._byRequestId.delete(record.requestId);
        }

        if (record.correlationId) {
          const correlationRecords = this._byCorrelationId.get(record.correlationId);
          if (correlationRecords) {
            const index = correlationRecords.findIndex(r => r.id === id);
            if (index !== -1) {
              correlationRecords.splice(index, 1);
            }
          }
        }

        if (record.usuarioId) {
          const usuarioRecords = this._byUsuario.get(record.usuarioId);
          if (usuarioRecords) {
            const index = usuarioRecords.findIndex(r => r.id === id);
            if (index !== -1) {
              usuarioRecords.splice(index, 1);
            }
          }
        }

        removed++;
      }
    }

    return removed;
  }

  /**
   * Limpa todo o armazenamento.
   * @returns {Promise<void>}
   */
  async clear() {
    this._records.clear();
    this._byRequestId.clear();
    this._byCorrelationId.clear();
    this._byUsuario.clear();
  }

  /**
   * Retorna o tamanho atual do armazenamento.
   * @returns {number}
   */
  size() {
    return this._records.size;
  }

  /**
   * Gera um ID único.
   * @private
   */
  _generateId() {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = InMemoryHttpAuditStore;
