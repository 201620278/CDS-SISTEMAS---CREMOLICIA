/**
 * BridgeDiagnosticService — Telemetria auditável das integrações O-13.
 *
 * @module motores/motor-comercial/bridges/diagnostic/BridgeDiagnosticService
 */

const MAX_ENTRIES = 500;

class BridgeDiagnosticService {
  constructor() {
    /** @private @type {Array<Object>} */
    this._entries = [];
  }

  /**
   * @param {Object} entry
   * @param {string} entry.bridge
   * @param {string} entry.method
   * @param {'OK'|'ERROR'|'FALLBACK'} entry.status
   * @param {number} entry.durationMs
   * @param {string} [entry.correlationId]
   * @param {string} [entry.error]
   * @param {boolean} [entry.fallback]
   * @param {Object} [entry.meta]
   */
  record(entry) {
    this._entries.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      bridge: entry.bridge,
      method: entry.method,
      status: entry.status,
      durationMs: entry.durationMs,
      correlationId: entry.correlationId ?? null,
      error: entry.error ?? null,
      fallback: Boolean(entry.fallback),
      meta: entry.meta ?? null
    });

    if (this._entries.length > MAX_ENTRIES) {
      this._entries.length = MAX_ENTRIES;
    }
  }

  /**
   * @param {number} [limit=50]
   * @returns {Array<Object>}
   */
  getRecent(limit = 50) {
    return this._entries.slice(0, limit);
  }

  /**
   * @returns {Object}
   */
  getSummary() {
    const summary = {
      total: this._entries.length,
      ok: 0,
      error: 0,
      fallback: 0,
      bridges: {}
    };

    for (const entry of this._entries) {
      if (entry.status === 'OK') summary.ok += 1;
      if (entry.status === 'ERROR') summary.error += 1;
      if (entry.fallback) summary.fallback += 1;

      if (!summary.bridges[entry.bridge]) {
        summary.bridges[entry.bridge] = { ok: 0, error: 0, fallback: 0, avgMs: 0, _totalMs: 0, _count: 0 };
      }
      const b = summary.bridges[entry.bridge];
      if (entry.status === 'OK') b.ok += 1;
      if (entry.status === 'ERROR') b.error += 1;
      if (entry.fallback) b.fallback += 1;
      b._totalMs += entry.durationMs;
      b._count += 1;
      b.avgMs = b._count ? Math.round(b._totalMs / b._count) : 0;
    }

    for (const b of Object.values(summary.bridges)) {
      delete b._totalMs;
      delete b._count;
    }

    return summary;
  }

  clear() {
    this._entries = [];
  }
}

/** @type {BridgeDiagnosticService|null} */
let singleton = null;

function obterBridgeDiagnosticService() {
  if (!singleton) {
    singleton = new BridgeDiagnosticService();
  }
  return singleton;
}

function resetBridgeDiagnosticService() {
  singleton = null;
}

module.exports = {
  BridgeDiagnosticService,
  obterBridgeDiagnosticService,
  resetBridgeDiagnosticService
};
