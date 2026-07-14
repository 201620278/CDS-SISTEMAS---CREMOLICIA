/**
 * EventTypes — Tipos de eventos publicados pelas Bridges.
 *
 * Sprint 2.6: Bridges Oficiais — definição de eventos.
 *
 * @module motores/motor-comercial/bridges/events/EventTypes
 */

class EventTypes {
  // ============================================================================
  // EVENTOS DE ESTOQUE
  // ============================================================================

  static ESTOQUE_ATUALIZADO = 'EstoqueAtualizado';
  static ESTOQUE_TRANSFERIDO = 'EstoqueTransferido';

  // ============================================================================
  // EVENTOS FINANCEIROS
  // ============================================================================

  static FINANCEIRO_LANCADO = 'FinanceiroLancado';
  static PAGAMENTO_REGISTRADO = 'PagamentoRegistrado';
  static PERDA_REGISTRADA = 'PerdaRegistrada';

  // ============================================================================
  // EVENTOS DE CLIENTE
  // ============================================================================

  static CLIENTE_BLOQUEADO = 'ClienteBloqueado';
  static CLIENTE_DESBLOQUEADO = 'ClienteDesbloqueado';
  static CLIENTE_SITUACAO_ALTERADA = 'ClienteSituacaoAlterada';

  // ============================================================================
  // EVENTOS DE USUÁRIO
  // ============================================================================

  static USUARIO_AUTORIZADO = 'UsuarioAutorizado';
  static USUARIO_NEGADO = 'UsuarioNegado';

  // ============================================================================
  // EVENTOS GERAIS
  // ============================================================================

  static BRIDGE_CHAMADA_INICIADA = 'BridgeChamadaIniciada';
  static BRIDGE_CHAMADA_COMPLETADA = 'BridgeChamadaCompletada';
  static BRIDGE_CHAMADA_FALHOU = 'BridgeChamadaFalhou';

  /**
   * Lista todos os tipos de eventos.
   * @returns {Array<string>}
   */
  static getAllTypes() {
    return [
      this.ESTOQUE_ATUALIZADO,
      this.ESTOQUE_TRANSFERIDO,
      this.FINANCEIRO_LANCADO,
      this.PAGAMENTO_REGISTRADO,
      this.PERDA_REGISTRADA,
      this.CLIENTE_BLOQUEADO,
      this.CLIENTE_DESBLOQUEADO,
      this.CLIENTE_SITUACAO_ALTERADA,
      this.USUARIO_AUTORIZADO,
      this.USUARIO_NEGADO,
      this.BRIDGE_CHAMADA_INICIADA,
      this.BRIDGE_CHAMADA_COMPLETADA,
      this.BRIDGE_CHAMADA_FALHOU
    ];
  }

  /**
   * Verifica se um tipo de evento é válido.
   * @param {string} eventType - Tipo de evento
   * @returns {boolean}
   */
  static isValid(eventType) {
    return this.getAllTypes().includes(eventType);
  }
}

module.exports = EventTypes;
