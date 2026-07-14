/**
 * CDS Recovery Framework — Persistência durável de checkpoints
 *
 * Usa localStorage (sobrevive ao fechar ERP / reboot).
 * NÃO usa sessionStorage como fonte primária.
 *
 * @module frontend/shared/recovery/RecoveryStorage
 */

const STORAGE_KEY = 'cds-recovery:v1';

function getStore() {
  if (typeof localStorage === 'undefined') return { records: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { records: {} };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { records: {} };
    if (!parsed.records || typeof parsed.records !== 'object') return { records: {} };
    return parsed;
  } catch (_e) {
    return { records: {} };
  }
}

function writeStore(store) {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (_e) {
    return false;
  }
}

function buildKey(moduleId, operation, entityId) {
  return `${moduleId}::${operation}::${entityId == null ? '_' : String(entityId)}`;
}

function read(key) {
  const store = getStore();
  return store.records[key] || null;
}

function write(key, record) {
  const store = getStore();
  // Não sobrescrever updatedAt/timestamp já selados — preserva checksum
  store.records[key] = { ...record };
  if (!store.records[key].updatedAt) {
    store.records[key].updatedAt = new Date().toISOString();
  }
  return writeStore(store);
}

function remove(key) {
  const store = getStore();
  if (!store.records[key]) return false;
  delete store.records[key];
  return writeStore(store);
}

function listAll() {
  const store = getStore();
  return Object.keys(store.records).map((key) => ({
    key,
    ...store.records[key]
  }));
}

function clearAll() {
  return writeStore({ records: {} });
}

function clearModule(moduleId) {
  const store = getStore();
  Object.keys(store.records).forEach((key) => {
    if (store.records[key]?.module === moduleId) {
      delete store.records[key];
    }
  });
  return writeStore(store);
}

module.exports = {
  STORAGE_KEY,
  buildKey,
  read,
  write,
  remove,
  listAll,
  clearAll,
  clearModule
};
