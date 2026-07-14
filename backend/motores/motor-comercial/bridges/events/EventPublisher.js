/**
 * EventPublisher — Publicador de eventos para Bridges.
 *
 * Sprint 2.6: Bridges Oficiais — infraestrutura de eventos.
 *
 * @module motores/motor-comercial/bridges/events/EventPublisher
 */

class EventPublisher {
  /**
   * Cria um publicador de eventos.
   * @param {Object} options
   * @param {Object} [options.logger] - Logger para registro de eventos
   * @returns {EventPublisher}
   */
  static create(options = {}) {
    return new EventPublisher(options);
  }

  constructor(options) {
    this._logger = options.logger;
    this._subscribers = new Map();
    this._eventHistory = [];
    this._maxHistorySize = 1000;
  }

  /**
   * Publica um evento.
   * @param {string} eventName - Nome do evento
   * @param {Object} payload - Payload do evento
   * @returns {Promise<void>}
   */
  async publish(eventName, payload) {
    const event = {
      id: this._generateEventId(),
      eventName,
      payload,
      timestamp: new Date().toISOString(),
      correlationId: payload.correlationId || null
    };

    // Adicionar ao histórico
    this._addToHistory(event);

    // Log do evento
    if (this._logger) {
      this._logger.info('EventPublisher.publish', {
        eventId: event.id,
        eventName,
        correlationId: event.correlationId
      });
    }

    // Notificar subscribers
    const subscribers = this._subscribers.get(eventName) || [];
    for (const subscriber of subscribers) {
      try {
        await subscriber(event);
      } catch (error) {
        if (this._logger) {
          this._logger.error('EventPublisher.publish - Subscriber error', {
            eventId: event.id,
            eventName,
            error: error.message
          });
        }
      }
    }
  }

  /**
   * Assina um evento.
   * @param {string} eventName - Nome do evento
   * @param {Function} handler - Handler do evento
   * @returns {Function} - Função para cancelar assinatura
   */
  subscribe(eventName, handler) {
    if (!this._subscribers.has(eventName)) {
      this._subscribers.set(eventName, []);
    }
    this._subscribers.get(eventName).push(handler);

    // Retorna função para cancelar assinatura
    return () => this.unsubscribe(eventName, handler);
  }

  /**
   * Cancela assinatura de um evento.
   * @param {string} eventName - Nome do evento
   * @param {Function} handler - Handler do evento
   * @returns {void}
   */
  unsubscribe(eventName, handler) {
    const subscribers = this._subscribers.get(eventName);
    if (subscribers) {
      const index = subscribers.indexOf(handler);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    }
  }

  /**
   * Obtém histórico de eventos.
   * @param {Object} [options] - Opções de filtro
   * @param {string} [options.eventName] - Nome do evento
   * @param {string} [options.correlationId] - ID de correlação
   * @param {number} [options.limit] - Limite de resultados
   * @returns {Array}
   */
  getHistory(options = {}) {
    let events = [...this._eventHistory];

    if (options.eventName) {
      events = events.filter(e => e.eventName === options.eventName);
    }

    if (options.correlationId) {
      events = events.filter(e => e.correlationId === options.correlationId);
    }

    // Ordenar por timestamp decrescente
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (options.limit) {
      events = events.slice(0, options.limit);
    }

    return events;
  }

  /**
   * Limpa histórico de eventos.
   * @returns {void}
   */
  clearHistory() {
    this._eventHistory = [];
  }

  /**
   * Adiciona evento ao histórico.
   * @private
   */
  _addToHistory(event) {
    this._eventHistory.push(event);

    // Manter tamanho máximo
    if (this._eventHistory.length > this._maxHistorySize) {
      this._eventHistory.shift();
    }
  }

  /**
   * Gera ID de evento único.
   * @private
   */
  _generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Define tamanho máximo do histórico.
   * @param {number} size - Tamanho máximo
   */
  setMaxHistorySize(size) {
    this._maxHistorySize = size;
  }

  /**
   * Obtém tamanho do histórico.
   * @returns {number}
   */
  getHistorySize() {
    return this._eventHistory.length;
  }
}

module.exports = EventPublisher;
