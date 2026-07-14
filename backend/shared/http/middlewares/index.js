/**
 * Middlewares HTTP — Index (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — infraestrutura compartilhada.
 *
 * @module backend/shared/http/middlewares
 */

const RequestIdMiddleware = require('./RequestIdMiddleware');
const CorrelationIdMiddleware = require('./CorrelationIdMiddleware');
const ResponseEnricherMiddleware = require('./ResponseEnricherMiddleware');
const ErrorHandlerMiddleware = require('./ErrorHandlerMiddleware');
const ValidationMiddleware = require('./ValidationMiddleware');
const LoggingMiddleware = require('./LoggingMiddleware');
const IdempotencyMiddleware = require('./IdempotencyMiddleware');
const RateLimitMiddleware = require('./RateLimitMiddleware');
const SecurityMiddleware = require('./SecurityMiddleware');

module.exports = {
  RequestIdMiddleware,
  CorrelationIdMiddleware,
  ResponseEnricherMiddleware,
  ErrorHandlerMiddleware,
  ValidationMiddleware,
  LoggingMiddleware,
  IdempotencyMiddleware,
  RateLimitMiddleware,
  SecurityMiddleware
};
