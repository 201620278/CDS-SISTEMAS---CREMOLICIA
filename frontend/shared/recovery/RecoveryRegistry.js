/**
 * CDS Recovery Framework — Registro de fluxos por módulo
 *
 * @module frontend/shared/recovery/RecoveryRegistry
 */

const operationsByModule = new Map();
const loaders = new Map();

function loaderKey(moduleId, operation) {
  return `${moduleId}::${operation}`;
}

/**
 * Registra operações suportadas por um módulo.
 * @param {string} moduleId
 * @param {string[]} operations
 */
function registerModule(moduleId, operations = []) {
  if (!moduleId) throw new Error('moduleId é obrigatório');
  const list = Array.isArray(operations) ? operations.map(String) : [];
  operationsByModule.set(moduleId, Object.freeze(list.slice()));
  return operationsByModule.get(moduleId);
}

/**
 * Registra loader oficial de reconstrução para um fluxo.
 * @param {string} moduleId
 * @param {string} operation
 * @param {Function} loaderFn async (context, helpers) => reconstructedState
 */
function registerLoader(moduleId, operation, loaderFn) {
  if (!moduleId || !operation) throw new Error('module e operation são obrigatórios');
  if (typeof loaderFn !== 'function') throw new Error('loaderFn deve ser função');
  loaders.set(loaderKey(moduleId, operation), loaderFn);
}

function getOperations(moduleId) {
  return operationsByModule.get(moduleId) || [];
}

function listModules() {
  return Array.from(operationsByModule.keys());
}

function getLoader(moduleId, operation) {
  return loaders.get(loaderKey(moduleId, operation)) || null;
}

function hasOperation(moduleId, operation) {
  return getOperations(moduleId).includes(operation);
}

function reset() {
  operationsByModule.clear();
  loaders.clear();
}

module.exports = {
  registerModule,
  registerLoader,
  getOperations,
  listModules,
  getLoader,
  hasOperation,
  reset
};
