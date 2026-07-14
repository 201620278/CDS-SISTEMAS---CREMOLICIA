/**
 * criarContainerPadrao — Bootstrap de DI do Motor Comercial.
 *
 * Sprint S-4.1: banco obrigatório — sem inicialização parcial.
 *
 * @param {Object} deps
 * @param {Object} deps.db
 * @returns {import('./ComercialDependencyContainer')}
 */

const InfrastructureError = require('../errors/InfrastructureError');
const ComercialDependencyContainer = require('./ComercialDependencyContainer');
const TransactionManager = require('../transactions/TransactionManager');
const UnitOfWork = require('../transactions/UnitOfWork');
const RepositoryFactory = require('../factories/RepositoryFactory');
const EventDispatcher = require('../events/EventDispatcher');
const EventPublisher = require('../events/EventPublisher');
const { bootstrapComercialDependencies } = require('./bootstrapComercial');

const TOKENS = Object.freeze({
  DB: 'db',
  TRANSACTION_MANAGER: 'transactionManager',
  REPOSITORY_FACTORY: 'repositoryFactory',
  UNIT_OF_WORK: 'unitOfWork',
  EVENT_DISPATCHER: 'eventDispatcher',
  EVENT_PUBLISHER: 'eventPublisher'
});

/**
 * @param {Object} deps
 * @returns {ComercialDependencyContainer}
 */
function criarContainerPadrao(deps = {}) {
  if (!deps.db) {
    throw new InfrastructureError(
      'criarContainerPadrao: banco de dados obrigatório.'
    );
  }

  const container = new ComercialDependencyContainer();

  container.registrar(TOKENS.DB, () => deps.db, { singleton: true });

  container.registrar(TOKENS.TRANSACTION_MANAGER, (c) => new TransactionManager({
    db: c.resolver(TOKENS.DB)
  }));

  container.registrar(TOKENS.REPOSITORY_FACTORY, (c) => new RepositoryFactory({
    db: c.resolver(TOKENS.DB)
  }));

  container.registrar(TOKENS.UNIT_OF_WORK, (c) => new UnitOfWork({
    transactionManager: c.resolver(TOKENS.TRANSACTION_MANAGER),
    repositoryFactory: c.resolver(TOKENS.REPOSITORY_FACTORY)
  }));

  container.registrar(TOKENS.EVENT_DISPATCHER, () => new EventDispatcher());

  container.registrar(TOKENS.EVENT_PUBLISHER, (c) => new EventPublisher({
    dispatcher: c.resolver(TOKENS.EVENT_DISPATCHER)
  }));

  bootstrapComercialDependencies(container, deps);

  return container;
}

module.exports = {
  TOKENS,
  criarContainerPadrao
};
