/**
 * CDS Recovery Framework — Eventos de auditoria / telemetria
 *
 * @module frontend/shared/recovery/RecoveryEvents
 */

const EVENT_TYPES = Object.freeze({
  RECOVERY_OPEN: 'RECOVERY_OPEN',
  RECOVERY_SAVE: 'RECOVERY_SAVE',
  RECOVERY_AUTOSAVE: 'RECOVERY_AUTOSAVE',
  RECOVERY_RESUME: 'RECOVERY_RESUME',
  RECOVERY_COMPLETE: 'RECOVERY_COMPLETE',
  RECOVERY_CANCEL: 'RECOVERY_CANCEL',
  RECOVERY_LOAD: 'RECOVERY_LOAD',
  RECOVERY_CLEAR: 'RECOVERY_CLEAR',
  RECOVERY_VALIDATE: 'RECOVERY_VALIDATE',
  RECOVERY_RECOVERED: 'RECOVERY_RECOVERED',
  RECOVERY_DISCARDED: 'RECOVERY_DISCARDED',
  RECOVERY_EXPIRED: 'RECOVERY_EXPIRED',
  RECOVERY_AUTH_RESTORED: 'RECOVERY_AUTH_RESTORED'
});

const DOM_EVENT = 'cds:recovery';
const MAX_LOG = 200;
const auditLog = [];

function emit(type, detail = {}) {
  const entry = {
    type,
    at: new Date().toISOString(),
    ...detail
  };

  auditLog.push(entry);
  if (auditLog.length > MAX_LOG) auditLog.shift();

  if (typeof document !== 'undefined' && typeof CustomEvent === 'function') {
    try {
      document.dispatchEvent(new CustomEvent(DOM_EVENT, { detail: entry }));
    } catch (_e) {
      /* ignore */
    }
  }

  if (typeof console !== 'undefined' && typeof console.info === 'function') {
    console.info(`[CDS Recovery] ${type}`, entry);
  }

  return entry;
}

function getAuditLog() {
  return auditLog.slice();
}

function clearAuditLog() {
  auditLog.length = 0;
}

module.exports = {
  EVENT_TYPES,
  DOM_EVENT,
  emit,
  getAuditLog,
  clearAuditLog
};
