/**
 * DomainEvent — Evento de domínio base.
 *
 * Sprint 2.2.5: infraestrutura — sem regras ou handlers concretos.
 *
 * @class DomainEvent
 */

class DomainEvent {
  /**
   * @param {Object} opcoes
   * @param {string} opcoes.tipo
   * @param {string|number} [opcoes.aggregateId]
   * @param {string} [opcoes.aggregateTipo]
   * @param {Object} [opcoes.payload]
   * @param {Date} [opcoes.ocorridoEm]
   * @param {string} [opcoes.correlationId]
   */
  constructor({
    tipo,
    aggregateId = null,
    aggregateTipo = null,
    payload = {},
    ocorridoEm = new Date(),
    correlationId = null
  }) {
    this.tipo = tipo;
    this.aggregateId = aggregateId;
    this.aggregateTipo = aggregateTipo;
    this.payload = payload;
    this.ocorridoEm = ocorridoEm;
    this.correlationId = correlationId;
    this.id = `${tipo}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      tipo: this.tipo,
      aggregateId: this.aggregateId,
      aggregateTipo: this.aggregateTipo,
      payload: this.payload,
      ocorridoEm: this.ocorridoEm,
      correlationId: this.correlationId
    };
  }
}

module.exports = DomainEvent;
