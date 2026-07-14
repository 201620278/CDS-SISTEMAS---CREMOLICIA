/**
 * CDS Recovery Framework — Ordem oficial de reconstrução
 *
 * 1. API oficial
 * 2. Recovery Provider
 * 3. Checkpoint
 * 4. Cache auxiliar
 *
 * @module frontend/shared/recovery/RecoveryProvider
 */

const RECONSTRUCTION_ORDER = Object.freeze([
  'api',
  'provider',
  'checkpoint',
  'cache'
]);

const providers = new Map();

function providerKey(moduleId, operation) {
  return `${moduleId}::${operation}`;
}

/**
 * Registra provider opcional do módulo (camada 2).
 * @param {string} moduleId
 * @param {string} operation
 * @param {Function} fn async (context, helpers) => partialState | null
 */
function register(moduleId, operation, fn) {
  if (typeof fn !== 'function') throw new Error('RecoveryProvider: fn inválida');
  providers.set(providerKey(moduleId, operation), fn);
}

function get(moduleId, operation) {
  return providers.get(providerKey(moduleId, operation)) || null;
}

function reset() {
  providers.clear();
}

/**
 * Mescla fontes na ordem oficial. Cada fonte pode aportar campos (ex.: itens).
 *
 * @param {Object} sources { api, provider, checkpoint, cache }
 * @param {string} field
 */
function pickField(sources, field) {
  for (const key of RECONSTRUCTION_ORDER) {
    const bucket = sources[key];
    if (!bucket || typeof bucket !== 'object') continue;
    const value = bucket[field];
    if (Array.isArray(value) && value.length) return { value, source: key };
    if (value != null && value !== '' && !Array.isArray(value)) {
      return { value, source: key };
    }
  }
  return { value: Array.isArray(sources.api?.[field]) ? [] : null, source: null };
}

/**
 * Resolve itens pela ordem oficial.
 */
function resolveItens(sources) {
  const picked = pickField(sources, 'itens');
  return {
    itens: Array.isArray(picked.value) ? picked.value : [],
    source: picked.source
  };
}

module.exports = {
  RECONSTRUCTION_ORDER,
  register,
  get,
  reset,
  pickField,
  resolveItens
};
