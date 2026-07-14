/**
 * BridgeContext — Contexto compartilhado para Bridges.
 *
 * Sprint 2.6: Bridges Oficiais — contexto de execução.
 *
 * @module motores/motor-comercial/bridges/BridgeContext
 */

class BridgeContext {
  /**
   * Cria um contexto de Bridge.
   * @param {Object} options
   * @param {string} options.requestId - ID da requisição
   * @param {string} options.correlationId - ID de correlação
   * @param {string} options.usuarioId - ID do usuário
   * @param {string} options.usuarioNome - Nome do usuário
   * @param {string} options.empresaId - ID da empresa
   * @param {string} options.filialId - ID da filial
   * @param {Date} options.data - Data da operação
   * @param {string} options.operacao - Tipo de operação
   * @param {Object} [options.metadata] - Metadados adicionais
   * @returns {BridgeContext}
   */
  static create(options) {
    return new BridgeContext(options);
  }

  constructor(options) {
    this.requestId = options.requestId || null;
    this.correlationId = options.correlationId || null;
    this.usuarioId = options.usuarioId || null;
    this.usuarioNome = options.usuarioNome || null;
    this.empresaId = options.empresaId || null;
    this.filialId = options.filialId || null;
    this.data = options.data || new Date();
    this.operacao = options.operacao || null;
    this.metadata = options.metadata || {};
  }

  /**
   * Cria um novo contexto com valores atualizados.
   * @param {Object} updates - Valores a atualizar
   * @returns {BridgeContext}
   */
  with(updates) {
    return BridgeContext.create({
      requestId: updates.requestId !== undefined ? updates.requestId : this.requestId,
      correlationId: updates.correlationId !== undefined ? updates.correlationId : this.correlationId,
      usuarioId: updates.usuarioId !== undefined ? updates.usuarioId : this.usuarioId,
      usuarioNome: updates.usuarioNome !== undefined ? updates.usuarioNome : this.usuarioNome,
      empresaId: updates.empresaId !== undefined ? updates.empresaId : this.empresaId,
      filialId: updates.filialId !== undefined ? updates.filialId : this.filialId,
      data: updates.data !== undefined ? updates.data : this.data,
      operacao: updates.operacao !== undefined ? updates.operacao : this.operacao,
      metadata: { ...this.metadata, ...updates.metadata }
    });
  }

  /**
   * Adiciona metadados ao contexto.
   * @param {Object} metadata - Metadados a adicionar
   * @returns {BridgeContext}
   */
  addMetadata(metadata) {
    return this.with({ metadata: { ...this.metadata, ...metadata } });
  }

  /**
   * Converte para objeto JSON.
   * @returns {Object}
   */
  toJSON() {
    return {
      requestId: this.requestId,
      correlationId: this.correlationId,
      usuarioId: this.usuarioId,
      usuarioNome: this.usuarioNome,
      empresaId: this.empresaId,
      filialId: this.filialId,
      data: this.data.toISOString(),
      operacao: this.operacao,
      metadata: this.metadata
    };
  }

  /**
   * Cria contexto a partir de objeto JSON.
   * @param {Object} json - Objeto JSON
   * @returns {BridgeContext}
   */
  static fromJSON(json) {
    return BridgeContext.create({
      requestId: json.requestId,
      correlationId: json.correlationId,
      usuarioId: json.usuarioId,
      usuarioNome: json.usuarioNome,
      empresaId: json.empresaId,
      filialId: json.filialId,
      data: json.data ? new Date(json.data) : new Date(),
      operacao: json.operacao,
      metadata: json.metadata || {}
    });
  }

  /**
   * Valida se o contexto está completo.
   * @returns {boolean}
   */
  isValid() {
    return !!this.correlationId && !!this.usuarioId;
  }

  /**
   * Retorna erros de validação.
   * @returns {Array<string>}
   */
  getValidationErrors() {
    const errors = [];

    if (!this.correlationId) {
      errors.push('correlationId é obrigatório');
    }

    if (!this.usuarioId) {
      errors.push('usuarioId é obrigatório');
    }

    return errors;
  }
}

module.exports = BridgeContext;
