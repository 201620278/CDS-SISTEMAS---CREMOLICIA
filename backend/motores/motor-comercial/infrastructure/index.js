/**
 * Infraestrutura do Motor Comercial — Sprint 2.2.5
 *
 * @module motores/motor-comercial/infrastructure
 */

const BaseRepository = require('./base/BaseRepository');
const Result = require('./result/Result');
const TransactionManager = require('./transactions/TransactionManager');
const UnitOfWork = require('./transactions/UnitOfWork');
const RepositoryFactory = require('./factories/RepositoryFactory');
const EventDispatcher = require('./events/EventDispatcher');
const EventPublisher = require('./events/EventPublisher');
const di = require('./di');
const repositories = require('./repositories');

module.exports = {
  BaseRepository,
  Result,
  TransactionManager,
  UnitOfWork,
  RepositoryFactory,
  EventDispatcher,
  EventPublisher,
  ComercialDependencyContainer: di.ComercialDependencyContainer,
  criarContainerPadrao: di.criarContainerPadrao,
  TOKENS: di.TOKENS,
  repositories
};
