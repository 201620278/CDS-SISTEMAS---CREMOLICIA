/**
 * Outbox Pattern — Infraestrutura compartilhada CDS Platform.
 *
 * Sprint P-2
 *
 * @module backend/shared/outbox
 */

const { OUTBOX_STATUS, criarOutboxEvent, mapOutboxEventFromRow } = require('./OutboxEvent');
const OutboxResult = require('./OutboxResult');
const { criarOutboxContext, contextoDeEvento } = require('./OutboxContext');
const { DEFAULTS, criarOutboxConfiguration } = require('./OutboxConfiguration');
const OutboxRepository = require('./OutboxRepository');
const OutboxDispatcher = require('./OutboxDispatcher');
const OutboxProcessor = require('./OutboxProcessor');
const OutboxService = require('./OutboxService');

module.exports = {
  OUTBOX_STATUS,
  criarOutboxEvent,
  mapOutboxEventFromRow,
  OutboxResult,
  criarOutboxContext,
  contextoDeEvento,
  DEFAULTS,
  criarOutboxConfiguration,
  OutboxRepository,
  OutboxDispatcher,
  OutboxProcessor,
  OutboxService
};
