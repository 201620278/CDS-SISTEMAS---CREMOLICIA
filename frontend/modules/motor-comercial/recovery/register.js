/**
 * Registro do Motor Comercial no Recovery Framework CDS
 *
 * @module frontend/modules/motor-comercial/recovery/register
 */

const { RecoveryRegistry } = require('../../../shared/recovery');
const { MODULE_ID, ALL_OPERATIONS, Operations } = require('./operations');
const { loadPrepararEntrega, loadEntrega } = require('./loaders');

let registered = false;

function registerMotorComercialRecovery() {
  // Reentra se o Registry foi resetado (testes / hot-reload)
  if (registered && RecoveryRegistry.getLoader(MODULE_ID, Operations.PREPARAR_ENTREGA)) {
    return;
  }
  RecoveryRegistry.registerModule(MODULE_ID, ALL_OPERATIONS);
  RecoveryRegistry.registerLoader(MODULE_ID, Operations.PREPARAR_ENTREGA, loadPrepararEntrega);
  RecoveryRegistry.registerLoader(MODULE_ID, Operations.ENTREGA, loadEntrega);
  registered = true;
}

function ensureRegistered() {
  registerMotorComercialRecovery();
}

module.exports = {
  registerMotorComercialRecovery,
  ensureRegistered
};
