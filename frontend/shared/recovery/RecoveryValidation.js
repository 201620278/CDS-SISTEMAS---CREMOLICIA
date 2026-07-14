/**
 * CDS Recovery Framework — Validação de integridade do checkpoint
 *
 * @module frontend/shared/recovery/RecoveryValidation
 */

const RecoveryEvents = require('./RecoveryEvents');

const SCHEMA_VERSION = 2;

function stableStringify(value) {
  if (value === undefined) {
    return 'null';
  }
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/**
 * Checksum estável (não criptográfico) para detectar corrupção.
 */
function computeChecksum(parts) {
  const payload = {
    module: parts.module,
    operation: parts.operation,
    entityId: parts.entityId == null ? null : parts.entityId,
    version: parts.version || SCHEMA_VERSION,
    checkpoint: parts.checkpoint || {},
    authorization: parts.authorization || null
  };
  const str = stableStringify(payload);
  let hash = 5381;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `v${SCHEMA_VERSION}:${(hash >>> 0).toString(16)}`;
}

function seal(record) {
  // Alinha com JSON.stringify do localStorage (omite undefined)
  const normalized = JSON.parse(JSON.stringify({
    module: record.module,
    operation: record.operation,
    entityId: record.entityId == null ? null : record.entityId,
    version: record.version || SCHEMA_VERSION,
    checkpoint: record.checkpoint || {},
    authorization: record.authorization || null,
    status: record.status,
    meta: record.meta || {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt || new Date().toISOString()
  }));

  const timestamp = normalized.updatedAt;
  const checksum = computeChecksum({
    module: normalized.module,
    operation: normalized.operation,
    entityId: normalized.entityId,
    version: SCHEMA_VERSION,
    checkpoint: normalized.checkpoint || {},
    authorization: normalized.authorization || null
  });

  return {
    ...normalized,
    version: SCHEMA_VERSION,
    timestamp,
    checksum,
    integrity: true
  };
}

/**
 * @returns {{ valid: boolean, reason?: string, upgraded?: boolean }}
 */
function validate(record, options = {}) {
  const emitAudit = options.emitAudit !== false;

  const emit = (ok, reason) => {
    if (!emitAudit) return;
    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_VALIDATE, {
      module: record?.module,
      operation: record?.operation,
      entityId: record?.entityId,
      ok,
      reason: reason || null
    });
  };

  if (!record || typeof record !== 'object') {
    emit(false, 'EMPTY');
    return { valid: false, reason: 'EMPTY' };
  }
  if (!record.module || !record.operation) {
    emit(false, 'MISSING_KEYS');
    return { valid: false, reason: 'MISSING_KEYS' };
  }
  if (record.entityId === undefined) {
    emit(false, 'MISSING_ENTITY');
    return { valid: false, reason: 'MISSING_ENTITY' };
  }

  // Legado RFC-01 sem checksum: aceita e sinaliza upgrade no próximo save
  if (!record.checksum) {
    emit(true, 'LEGACY_NO_CHECKSUM');
    return { valid: true, reason: 'LEGACY_NO_CHECKSUM', upgraded: true };
  }

  const expected = computeChecksum({
    module: record.module,
    operation: record.operation,
    entityId: record.entityId,
    version: record.version || SCHEMA_VERSION,
    checkpoint: record.checkpoint || {},
    authorization: record.authorization || null
  });

  if (record.checksum !== expected) {
    emit(false, 'CHECKSUM_MISMATCH');
    return { valid: false, reason: 'CHECKSUM_MISMATCH' };
  }

  emit(true, 'OK');
  return { valid: true, reason: 'OK' };
}

function isDraftEntityId(entityId) {
  return typeof entityId === 'string' && entityId.startsWith('draft-');
}

function createDraftEntityId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `draft-${Date.now()}-${rand}`;
}

module.exports = {
  SCHEMA_VERSION,
  computeChecksum,
  seal,
  validate,
  isDraftEntityId,
  createDraftEntityId,
  stableStringify
};
