/**
 * Guards de infraestrutura para Platform Gateways.
 *
 * Sprint S-4.1
 *
 * @module motores/motor-comercial/bridges/platform/platformGatewayGuards
 */

const InfrastructureError = require('../../infrastructure/errors/InfrastructureError');

/**
 * @param {Object} deps
 * @param {string} [contexto]
 * @returns {Object}
 */
function exigirBancoNosDeps(deps, contexto = 'PlatformGateway') {
  if (!deps?.db) {
    throw new InfrastructureError(
      `${contexto}: banco de dados não configurado. Inicialização do Motor Comercial cancelada.`,
      { contexto }
    );
  }
  return deps.db;
}

/**
 * @param {Object} gateway
 * @param {string} [operacao]
 */
function assegurarBancoNoGateway(gateway, operacao = 'operação') {
  if (!gateway?._db) {
    const nome = gateway?.constructor?.name || 'PlatformGateway';
    throw new InfrastructureError(
      `${nome} sem conexão com o banco durante ${operacao}.`,
      { gateway: nome, operacao }
    );
  }
}

module.exports = {
  exigirBancoNosDeps,
  assegurarBancoNoGateway
};
