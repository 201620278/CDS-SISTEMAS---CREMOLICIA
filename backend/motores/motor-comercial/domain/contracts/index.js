/**
 * Contratos de domínio do Motor Comercial.
 *
 * @module motores/motor-comercial/domain/contracts
 */

const repositories = require('./repositories');
const bridges = require('./bridges');
const IProjectionCache = require('./projections/IProjectionCache');

module.exports = {
  ...repositories,
  ...bridges,
  IProjectionCache
};
