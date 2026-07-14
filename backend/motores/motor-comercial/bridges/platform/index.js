/**
 * Platform gateways — export centralizado.
 *
 * @module motores/motor-comercial/bridges/platform
 */

const ClientePlatformGateway = require('./ClientePlatformGateway');
const ProdutoPlatformGateway = require('./ProdutoPlatformGateway');
const EstoquePlatformGateway = require('./EstoquePlatformGateway');
const FinanceiroPlatformGateway = require('./FinanceiroPlatformGateway');
const UsuarioPlatformGateway = require('./UsuarioPlatformGateway');
const { wrapWithDiagnostic } = require('./wrapWithDiagnostic');
const { obterBridgeDiagnosticService } = require('../diagnostic/BridgeDiagnosticService');

const { exigirBancoNosDeps } = require('./platformGatewayGuards');

/**
 * @param {Object} deps
 * @param {Object} deps.db
 * @returns {Object}
 */
function criarPlatformGateways(deps = {}) {
  exigirBancoNosDeps(deps, 'criarPlatformGateways');
  const diagnostic = obterBridgeDiagnosticService();

  const raw = {
    cliente: new ClientePlatformGateway(deps),
    produto: new ProdutoPlatformGateway(deps),
    estoque: new EstoquePlatformGateway(deps),
    financeiro: new FinanceiroPlatformGateway(deps),
    usuario: new UsuarioPlatformGateway(deps)
  };

  return {
    cliente: wrapWithDiagnostic('Cliente', raw.cliente, diagnostic),
    produto: wrapWithDiagnostic('Produto', raw.produto, diagnostic),
    estoque: wrapWithDiagnostic('Estoque', raw.estoque, diagnostic),
    financeiro: wrapWithDiagnostic('Financeiro', raw.financeiro, diagnostic),
    usuario: wrapWithDiagnostic('Usuario', raw.usuario, diagnostic),
    diagnostic
  };
}

module.exports = {
  ClientePlatformGateway,
  ProdutoPlatformGateway,
  EstoquePlatformGateway,
  FinanceiroPlatformGateway,
  UsuarioPlatformGateway,
  criarPlatformGateways
};
