/**
 * EventPublisher — Publicação de eventos de domínio.
 *
 * Sprint 2.2.5: infraestrutura base — sem regras comerciais.
 *
 * @class EventPublisher
 */

const EventDispatcher = require('./EventDispatcher');

class EventPublisher {
  /**
   * @param {Object} [deps]
   * @param {EventDispatcher} [deps.dispatcher]
   */
  constructor(deps = {}) {
    this._dispatcher = deps.dispatcher ?? new EventDispatcher();
    /** @private @type {import('../../domain/events/DomainEvent')[]} */
    this._pendentes = [];
  }

  /**
   * @returns {EventDispatcher}
   */
  get dispatcher() {
    return this._dispatcher;
  }

  /**
   * @param {import('../../domain/events/DomainEvent')} evento
   */
  publicar(evento) {
    this._pendentes.push(evento);
  }

  /**
   * @returns {import('../../domain/events/DomainEvent')[]}
   */
  obterPendentes() {
    return [...this._pendentes];
  }

  /**
   * @returns {Promise<void>}
   */
  async flush() {
    const eventos = this._pendentes.splice(0);
    for (const evento of eventos) {
      await this._dispatcher.dispatch(evento);
    }
  }

  /**
   * @returns {void}
   */
  limpar() {
    this._pendentes = [];
  }
}

module.exports = EventPublisher;
