/**
 * CDS Recovery Framework — Ponto de entrada oficial (Enterprise)
 *
 * @module frontend/shared/recovery
 */

const RecoveryManager = require('./RecoveryManager');
const RecoveryRegistry = require('./RecoveryRegistry');
const RecoveryContext = require('./RecoveryContext');
const RecoveryLoader = require('./RecoveryLoader');
const RecoveryStorage = require('./RecoveryStorage');
const RecoveryEvents = require('./RecoveryEvents');
const RecoveryValidation = require('./RecoveryValidation');
const RecoveryMessages = require('./RecoveryMessages');
const RecoveryProvider = require('./RecoveryProvider');
const {
  RecoveryStatus,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
  isActiveStatus,
  isTerminalStatus,
  isValidStatus
} = require('./RecoveryStatus');

module.exports = {
  RecoveryManager,
  RecoveryRegistry,
  RecoveryContext,
  RecoveryLoader,
  RecoveryStorage,
  RecoveryEvents,
  RecoveryValidation,
  RecoveryMessages,
  RecoveryProvider,
  RecoveryStatus,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
  isActiveStatus,
  isTerminalStatus,
  isValidStatus
};
