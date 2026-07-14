/**
 * Bootstrap Outbox do Motor Comercial — Sprint P-2.
 *
 * @module motores/motor-comercial/integrations/outbox/bootstrapOutbox
 */

const {
  criarOutboxConfiguration,
  OutboxRepository,
  OutboxDispatcher,
  OutboxProcessor,
  OutboxService
} = require('../../../../shared/outbox');
const { criarComercialOutboxHandlers } = require('./ComercialOutboxHandlers');

/**
 * @param {Object} deps
 * @param {Object} [deps.db]
 * @param {Object} [deps.bridges]
 * @param {Object} [deps.config]
 * @returns {{ outboxService: OutboxService, outboxRepository: OutboxRepository, outboxProcessor: OutboxProcessor, outboxDispatcher: OutboxDispatcher }}
 */
function bootstrapOutbox(deps = {}) {
  const config = criarOutboxConfiguration({
    motor: 'motor-comercial',
    ...deps.config
  });

  const outboxRepository = new OutboxRepository({ db: deps.db ?? null, config });
  const outboxDispatcher = new OutboxDispatcher({ config, logger: config.logger });
  outboxDispatcher.registrarHandlers(criarComercialOutboxHandlers(deps.bridges ?? {}));

  const outboxProcessor = new OutboxProcessor({
    repository: outboxRepository,
    dispatcher: outboxDispatcher,
    config,
    logger: config.logger
  });

  const outboxService = new OutboxService({
    repository: outboxRepository,
    processor: outboxProcessor,
    config,
    criarRepository: (db) => new OutboxRepository({ db, config })
  });

  return {
    outboxService,
    outboxRepository,
    outboxProcessor,
    outboxDispatcher
  };
}

module.exports = { bootstrapOutbox };
