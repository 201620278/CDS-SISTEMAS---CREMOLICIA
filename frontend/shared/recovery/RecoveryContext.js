/**
 * CDS Recovery Framework — Contexto de uma operação recuperável
 *
 * @module frontend/shared/recovery/RecoveryContext
 */

const { RecoveryStatus, isValidStatus } = require('./RecoveryStatus');
const { SCHEMA_VERSION } = require('./RecoveryValidation');

function normalizeAuthorization(auth) {
  if (!auth || typeof auth !== 'object') return null;
  if (auth.authorized !== true && auth.autorizado !== true) return null;
  return {
    authorized: true,
    authorizedBy: auth.authorizedBy || auth.supervisorUsername || auth.username || null,
    authorizedAt: auth.authorizedAt || auth.at || new Date().toISOString(),
    reason: auth.reason || auth.motivo || null,
    expiresOnComplete: auth.expiresOnComplete !== false,
    expiresAt: auth.expiresAt || null,
    fingerprint: auth.fingerprint || null,
    supervisorToken: auth.supervisorToken || null,
    consignacaoId: auth.consignacaoId != null ? auth.consignacaoId : null
  };
}

class RecoveryContext {
  /**
   * @param {Object} data
   */
  constructor(data = {}) {
    this.module = data.module;
    this.operation = data.operation;
    this.entityId = data.entityId == null ? null : data.entityId;
    this.status = isValidStatus(data.status) ? data.status : RecoveryStatus.NOVO;
    this.checkpoint = data.checkpoint && typeof data.checkpoint === 'object' && !Array.isArray(data.checkpoint)
      ? data.checkpoint
      : {};
    this.meta = data.meta && typeof data.meta === 'object' ? data.meta : {};
    this.authorization = normalizeAuthorization(data.authorization);
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || this.createdAt;
    this.timestamp = data.timestamp || this.updatedAt;
    this.version = data.version || SCHEMA_VERSION;
    this.checksum = data.checksum || null;
    this.integrity = data.integrity !== false;
  }

  get keyParts() {
    return {
      module: this.module,
      operation: this.operation,
      entityId: this.entityId
    };
  }

  withCheckpoint(checkpoint = {}, status = null) {
    return new RecoveryContext({
      ...this.toJSON(),
      checkpoint: { ...this.checkpoint, ...checkpoint },
      status: status && isValidStatus(status) ? status : this.status,
      updatedAt: new Date().toISOString(),
      checksum: null
    });
  }

  withStatus(status) {
    return new RecoveryContext({
      ...this.toJSON(),
      status: isValidStatus(status) ? status : this.status,
      updatedAt: new Date().toISOString(),
      checksum: null
    });
  }

  withEntityId(entityId) {
    return new RecoveryContext({
      ...this.toJSON(),
      entityId,
      updatedAt: new Date().toISOString(),
      checksum: null
    });
  }

  withAuthorization(authorization) {
    return new RecoveryContext({
      ...this.toJSON(),
      authorization: authorization == null ? null : normalizeAuthorization(authorization),
      updatedAt: new Date().toISOString(),
      checksum: null
    });
  }

  clearAuthorization() {
    return this.withAuthorization(null);
  }

  isAuthorizationValid(fingerprint = null) {
    const auth = this.authorization;
    if (!auth || !auth.authorized) return false;
    if (auth.expiresAt && new Date(auth.expiresAt).getTime() < Date.now()) return false;
    if (fingerprint && auth.fingerprint && auth.fingerprint !== fingerprint) return false;
    return true;
  }

  /** Formato compatível com liberação gerencial do Motor Comercial */
  toLiberacaoCompat() {
    if (!this.isAuthorizationValid()) return null;
    const a = this.authorization;
    return {
      autorizado: true,
      authorized: true,
      authorizedBy: a.authorizedBy,
      authorizedAt: a.authorizedAt,
      motivo: a.reason,
      reason: a.reason,
      expiresOnComplete: a.expiresOnComplete,
      expiresAt: a.expiresAt,
      fingerprint: a.fingerprint,
      supervisorToken: a.supervisorToken,
      consignacaoId: a.consignacaoId != null ? a.consignacaoId : this.entityId
    };
  }

  toJSON() {
    return {
      module: this.module,
      operation: this.operation,
      entityId: this.entityId,
      status: this.status,
      checkpoint: this.checkpoint,
      meta: this.meta,
      authorization: this.authorization,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      timestamp: this.timestamp || this.updatedAt,
      version: this.version,
      checksum: this.checksum,
      integrity: this.integrity
    };
  }

  static fromJSON(data) {
    if (!data || !data.module || !data.operation) return null;
    return new RecoveryContext(data);
  }
}

module.exports = RecoveryContext;
