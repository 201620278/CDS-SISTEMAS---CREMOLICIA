/**
 * OutboxDispatcher — Executa handlers de Bridge para eventos Outbox.
 *
 * @module backend/shared/outbox/OutboxDispatcher
 */

const OutboxResult = require('./OutboxResult');
const { contextoDeEvento } = require('./OutboxContext');
const { OUTBOX_STATUS } = require('./OutboxEvent');

class OutboxDispatcher {
  /**
   * @param {Object} [deps]
   * @param {Object} [deps.config]
   * @param {Object} [deps.logger]
   */
  constructor(deps = {}) {
    this._config = deps.config ?? {};
    this._logger = deps.logger ?? console;
    /** @type {Map<string, Function>} */
    this._handlers = new Map();
  }

  /**
   * @param {string} eventType
   * @param {Function} handler
   */
  registrarHandler(eventType, handler) {
    this._handlers.set(eventType, handler);
  }

  /**
   * @param {Object} handlers
   */
  registrarHandlers(handlers = {}) {
    Object.entries(handlers).forEach(([eventType, handler]) => {
      this.registrarHandler(eventType, handler);
    });
  }

  /**
   * @returns {string[]}
   */
  listarEventTypes() {
    return Array.from(this._handlers.keys());
  }

  /**
   * @param {Object} evento
   * @returns {Promise<OutboxResult>}
   */
  async dispatch(evento) {
    const inicio = Date.now();
    const contexto = contextoDeEvento(evento);

    if (evento.status === OUTBOX_STATUS.COMPLETED) {
      return OutboxResult.ok({ skipped: true, motivo: 'idempotente' }, {
        ...contexto.metadata,
        durationMs: 0
      });
    }

    const handler = this._handlers.get(evento.eventType);
    if (!handler) {
      const erro = new Error(`Handler Outbox não registrado: ${evento.eventType}`);
      this._log('error', 'dispatch.handler_nao_encontrado', evento, erro);
      return OutboxResult.fail(erro, {
        eventType: evento.eventType,
        bridgeName: evento.bridgeName,
        correlationId: evento.correlationId,
        durationMs: Date.now() - inicio
      });
    }

    try {
      const resultado = await handler(evento.payload, contexto);
      const durationMs = Date.now() - inicio;

      this._log('info', 'dispatch.sucesso', evento, null, durationMs);

      return OutboxResult.ok(resultado, {
        eventType: evento.eventType,
        bridgeName: evento.bridgeName,
        correlationId: evento.correlationId,
        requestId: evento.requestId,
        attempts: evento.attempts,
        durationMs
      });
    } catch (erro) {
      const durationMs = Date.now() - inicio;
      this._log('error', 'dispatch.falha', evento, erro, durationMs);

      return OutboxResult.fail(erro, {
        eventType: evento.eventType,
        bridgeName: evento.bridgeName,
        correlationId: evento.correlationId,
        requestId: evento.requestId,
        attempts: evento.attempts,
        durationMs
      });
    }
  }

  /**
   * @private
   */
  _log(nivel, acao, evento, erro, durationMs) {
    const payload = {
      acao,
      eventId: evento.id,
      eventType: evento.eventType,
      bridge: evento.bridgeName,
      correlationId: evento.correlationId,
      requestId: evento.requestId,
      attempts: evento.attempts,
      status: evento.status,
      durationMs: durationMs ?? null,
      erro: erro?.message ?? null
    };

    const logger = this._logger;
    if (typeof logger[nivel] === 'function') {
      logger[nivel]('[OutboxDispatcher]', payload);
    }
  }
}

module.exports = OutboxDispatcher;
