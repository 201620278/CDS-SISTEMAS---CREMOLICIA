/**
 * Middlewares HTTP — Index.
 *
 * Sprint 2.5: API REST — middlewares.
 *
 * @module motores/motor-comercial/http/middlewares
 */

const RequestIdMiddleware = require('./RequestIdMiddleware');
const CorrelationIdMiddleware = require('./CorrelationIdMiddleware');
const ErrorHandlerMiddleware = require('./ErrorHandlerMiddleware');
const ValidationMiddleware = require('./ValidationMiddleware');
const LoggingMiddleware = require('./LoggingMiddleware');

module.exports = {
  RequestIdMiddleware,
  CorrelationIdMiddleware,
  ErrorHandlerMiddleware,
  ValidationMiddleware,
  LoggingMiddleware
};
