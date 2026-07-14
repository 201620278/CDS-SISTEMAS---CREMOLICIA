/**
 * Resilience — Index (versão corporativa).
 *
 * Sprint 2.6: Bridges Oficiais — infraestrutura de resiliência.
 *
 * @module motores/motor-comercial/bridges/resilience
 */

const RetryPolicy = require('./RetryPolicy');
const CircuitBreaker = require('./CircuitBreaker');
const TimeoutPolicy = require('./TimeoutPolicy');
const FallbackPolicy = require('./FallbackPolicy');
const ResilienceChain = require('./ResilienceChain');
const { DEFAULTS, BRIDGE_NAMES, criarResilienceConfiguration } = require('./ResilienceConfiguration');
const ResilienceDiagnosticService = require('./ResilienceDiagnosticService');
const ResilienceBridgeExecutor = require('./ResilienceBridgeExecutor');
const { ResilienceRegistry, criarResilienceRegistry, criarFallbackPadrao } = require('./ResilienceRegistry');
const { wrapBridgeWithResilience } = require('./wrapBridgeWithResilience');

module.exports = {
  RetryPolicy,
  CircuitBreaker,
  TimeoutPolicy,
  FallbackPolicy,
  ResilienceChain,
  DEFAULTS,
  BRIDGE_NAMES,
  criarResilienceConfiguration,
  ResilienceDiagnosticService,
  ResilienceBridgeExecutor,
  ResilienceRegistry,
  criarResilienceRegistry,
  criarFallbackPadrao,
  wrapBridgeWithResilience
};
