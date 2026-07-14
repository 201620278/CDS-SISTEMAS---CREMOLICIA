/**
 * Bridge adapters — export centralizado.
 *
 * Sprint P-3: todas as Bridges passam pelo ResilienceChain.
 *
 * @module motores/motor-comercial/bridges/adapters
 */

const ClienteBridgeAdapter = require('./ClienteBridgeAdapter');
const ProdutoBridgeAdapter = require('./ProdutoBridgeAdapter');
const EstoqueBridgeAdapter = require('./EstoqueBridgeAdapter');
const FinanceiroBridgeAdapter = require('./FinanceiroBridgeAdapter');
const UsuarioBridgeAdapter = require('./UsuarioBridgeAdapter');
const { criarPlatformGateways } = require('../platform');
const { wrapBridgeWithResilience } = require('../resilience/wrapBridgeWithResilience');
const { bootstrapResilience } = require('../resilience/bootstrapResilience');

/**
 * @param {Object} deps
 * @param {Object} deps.db
 * @param {import('../resilience/ResilienceRegistry')} [deps.resilienceRegistry]
 * @returns {Object}
 */
function criarBridgeAdapters(deps = {}) {
  const gateways = criarPlatformGateways(deps);
  const resilienceRegistry = deps.resilienceRegistry ?? bootstrapResilience(deps.resilience ?? {});

  const raw = {
    clienteBridge: new ClienteBridgeAdapter({ platform: gateways.cliente }),
    produtoBridge: new ProdutoBridgeAdapter({ platform: gateways.produto }),
    estoqueBridge: new EstoqueBridgeAdapter({ platform: gateways.estoque }),
    financeiroBridge: new FinanceiroBridgeAdapter({ platform: gateways.financeiro }),
    usuarioBridge: new UsuarioBridgeAdapter({ platform: gateways.usuario })
  };

  return {
    clienteBridge: wrapBridgeWithResilience(raw.clienteBridge, 'Cliente', resilienceRegistry),
    produtoBridge: wrapBridgeWithResilience(raw.produtoBridge, 'Produto', resilienceRegistry),
    estoqueBridge: wrapBridgeWithResilience(raw.estoqueBridge, 'Estoque', resilienceRegistry),
    financeiroBridge: wrapBridgeWithResilience(raw.financeiroBridge, 'Financeiro', resilienceRegistry),
    usuarioBridge: wrapBridgeWithResilience(raw.usuarioBridge, 'Usuario', resilienceRegistry),
    bridgeDiagnosticService: gateways.diagnostic,
    platformGateways: gateways,
    resilienceRegistry
  };
}

module.exports = {
  ClienteBridgeAdapter,
  ProdutoBridgeAdapter,
  EstoqueBridgeAdapter,
  FinanceiroBridgeAdapter,
  UsuarioBridgeAdapter,
  criarBridgeAdapters
};
