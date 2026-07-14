/**
 * IHttpAuditStore — Interface para armazenamento de auditoria HTTP.
 *
 * Sprint 2.5.5: Hardening da API — interface de auditoria HTTP.
 *
 * @module backend/shared/http/audit/IHttpAuditStore
 */

class IHttpAuditStore {
  /**
   * Armazena um registro de auditoria.
   * @param {Object} auditRecord - Registro de auditoria
   * @returns {Promise<void>}
   */
  async store(auditRecord) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca registros de auditoria por filtros.
   * @param {Object} filters - Filtros de busca
   * @param {string} [filters.requestId] - ID da requisição
   * @param {string} [filters.correlationId] - ID de correlação
   * @param {string} [filters.usuarioId] - ID do usuário
   * @param {string} [filters.method] - Método HTTP
   * @param {string} [filters.path] - Caminho da requisição
   * @param {number} [filters.statusCode] - Status code
   * @param {Date} [filters.startDate] - Data inicial
   * @param {Date} [filters.endDate] - Data final
   * @param {number} [filters.limit] - Limite de resultados
   * @param {number} [filters.offset] - Offset para paginação
   * @returns {Promise<Array>}
   */
  async findByFilters(filters) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca registro por requestId.
   * @param {string} requestId - ID da requisição
   * @returns {Promise<Object|null>}
   */
  async findByRequestId(requestId) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca registros por correlationId.
   * @param {string} correlationId - ID de correlação
   * @returns {Promise<Array>}
   */
  async findByCorrelationId(correlationId) {
    throw new Error('Method not implemented');
  }

  /**
   * Busca registros por usuário.
   * @param {string} usuarioId - ID do usuário
   * @param {Object} [options] - Opções de busca
   * @returns {Promise<Array>}
   */
  async findByUsuario(usuarioId, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Remove registros antigos (cleanup).
   * @param {Date} beforeDate - Data limite para remoção
   * @returns {Promise<number>} - Número de registros removidos
   */
  async cleanup(beforeDate) {
    throw new Error('Method not implemented');
  }
}

module.exports = IHttpAuditStore;
