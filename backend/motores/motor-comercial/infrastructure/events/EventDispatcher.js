/**
 * EventDispatcher — Despacho de eventos de domínio.
 *
 * Sprint 2.2.5: infraestrutura base — handlers serão registrados nas próximas sprints.
 *
 * @class EventDispatcher
 */

class EventDispatcher {
  constructor() {
    /** @private @type {Map<string, Function[]>} */
    this._handlers = new Map();
  }

  /**
   * @param {string} tipoEvento
   * @param {Function} handler
   */
  registrar(tipoEvento, handler) {
    const lista = this._handlers.get(tipoEvento) ?? [];
    lista.push(handler);
    this._handlers.set(tipoEvento, lista);
  }

  /**
   * @param {import('./DomainEvent')} evento
   * @returns {Promise<void>}
   */
  async dispatch(evento) {
    const handlers = this._handlers.get(evento.tipo) ?? [];
    for (const handler of handlers) {
      await handler(evento);
    }
  }

  /**
   * @returns {void}
   */
  limpar() {
    this._handlers.clear();
  }
}

module.exports = EventDispatcher;
