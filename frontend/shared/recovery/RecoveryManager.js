/**
 * CDS Recovery Framework — API pública (Enterprise / RFC-03)
 *
 * @module frontend/shared/recovery/RecoveryManager
 */

const RecoveryContext = require('./RecoveryContext');
const RecoveryStorage = require('./RecoveryStorage');
const RecoveryLoader = require('./RecoveryLoader');
const RecoveryEvents = require('./RecoveryEvents');
const RecoveryRegistry = require('./RecoveryRegistry');
const RecoveryValidation = require('./RecoveryValidation');
const RecoveryMessages = require('./RecoveryMessages');
const {
  RecoveryStatus,
  isActiveStatus,
  isValidStatus
} = require('./RecoveryStatus');

function requireParams({ module: moduleId, operation, entityId }) {
  if (!moduleId) throw new Error('RecoveryManager: module é obrigatório');
  if (!operation) throw new Error('RecoveryManager: operation é obrigatório');
  return {
    module: String(moduleId),
    operation: String(operation),
    entityId: entityId == null ? null : entityId
  };
}

function storageKey(params) {
  const p = requireParams(params);
  return RecoveryStorage.buildKey(p.module, p.operation, p.entityId);
}

function persistContext(ctx) {
  const sealed = RecoveryValidation.seal(ctx.toJSON());
  const key = RecoveryStorage.buildKey(sealed.module, sealed.operation, sealed.entityId);
  RecoveryStorage.write(key, sealed);
  return RecoveryContext.fromJSON(sealed);
}

/**
 * Lê e valida. Checkpoint inválido → descarta (não quebra).
 */
function readContext(params, options = {}) {
  const key = storageKey(params);
  const raw = RecoveryStorage.read(key);
  if (!raw) return null;

  const validation = RecoveryValidation.validate(raw, { emitAudit: options.emitAudit !== false });
  if (!validation.valid) {
    if (options.emitAudit === false) {
      RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_VALIDATE, {
        module: raw.module,
        operation: raw.operation,
        entityId: raw.entityId,
        ok: false,
        reason: validation.reason
      });
    }
    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_DISCARDED, {
      module: raw.module,
      operation: raw.operation,
      entityId: raw.entityId,
      reason: validation.reason
    });
    if (options.removeInvalid !== false) {
      RecoveryStorage.remove(key);
    }
    return null;
  }

  let ctx = RecoveryContext.fromJSON(raw);
  if (validation.upgraded) {
    ctx = persistContext(ctx);
  }
  return ctx;
}

class RecoveryHandle {
  constructor(context) {
    this._context = context;
  }

  get context() {
    return this._context;
  }

  save(checkpoint = {}, status = null) {
    return RecoveryManager.save(this._context.keyParts, checkpoint, status);
  }

  autosave(checkpoint = {}, status = null) {
    return RecoveryManager.autosave(this._context.keyParts, checkpoint, status);
  }

  async load(helpers = {}) {
    return RecoveryManager.load(this._context.keyParts, helpers);
  }

  async resume(helpers = {}) {
    return RecoveryManager.resume(this._context.keyParts, helpers);
  }

  complete(meta = {}) {
    return RecoveryManager.complete(this._context.keyParts, meta);
  }

  cancel(meta = {}) {
    return RecoveryManager.cancel(this._context.keyParts, meta);
  }

  setAuthorization(authorization) {
    return RecoveryManager.setAuthorization(this._context.keyParts, authorization);
  }

  exists() {
    return RecoveryManager.exists(this._context.keyParts);
  }

  clear() {
    return RecoveryManager.clear(this._context.keyParts);
  }
}

const RecoveryManager = {
  open(options = {}) {
    const params = requireParams(options);
    let ctx = readContext(params);

    if (!ctx) {
      ctx = new RecoveryContext({
        module: params.module,
        operation: params.operation,
        entityId: params.entityId,
        status: isValidStatus(options.status) ? options.status : RecoveryStatus.NOVO,
        checkpoint: options.checkpoint || {},
        meta: options.meta || {},
        authorization: options.authorization || null
      });
    } else {
      if (options.meta) {
        ctx = new RecoveryContext({ ...ctx.toJSON(), meta: { ...ctx.meta, ...options.meta }, checksum: null });
      }
      if (options.checkpoint) ctx = ctx.withCheckpoint(options.checkpoint);
      if (isValidStatus(options.status)) ctx = ctx.withStatus(options.status);
      if (options.authorization) ctx = ctx.withAuthorization(options.authorization);
    }

    ctx = persistContext(ctx);
    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_OPEN, {
      module: ctx.module,
      operation: ctx.operation,
      entityId: ctx.entityId,
      status: ctx.status
    });

    return new RecoveryHandle(ctx);
  },

  save(params, checkpoint = {}, status = null) {
    const p = requireParams(params);
    let ctx = readContext(p, { emitAudit: false });
    if (!ctx) {
      ctx = new RecoveryContext({
        module: p.module,
        operation: p.operation,
        entityId: p.entityId,
        status: RecoveryStatus.EM_ANDAMENTO,
        checkpoint: {}
      });
    }

    const nextStatus = isValidStatus(status)
      ? status
      : (ctx.status === RecoveryStatus.NOVO ? RecoveryStatus.EM_ANDAMENTO : ctx.status);

    ctx = ctx.withCheckpoint(checkpoint, nextStatus);
    ctx = persistContext(ctx);

    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_SAVE, {
      module: ctx.module,
      operation: ctx.operation,
      entityId: ctx.entityId,
      status: ctx.status
    });

    return new RecoveryHandle(ctx);
  },

  /**
   * Autosave transparente — estado operacional apenas.
   * Não interrompe o operador; não grava regras de negócio no backend.
   */
  autosave(params, checkpoint = {}, status = null) {
    const handle = RecoveryManager.save(params, checkpoint, status || RecoveryStatus.EM_ANDAMENTO);
    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_AUTOSAVE, {
      module: handle.context.module,
      operation: handle.context.operation,
      entityId: handle.context.entityId,
      status: handle.context.status
    });
    return handle;
  },

  setAuthorization(params, authorization) {
    const p = requireParams(params);
    let ctx = readContext(p, { emitAudit: false });
    if (!ctx) {
      ctx = new RecoveryContext({
        module: p.module,
        operation: p.operation,
        entityId: p.entityId,
        status: RecoveryStatus.EM_ANDAMENTO
      });
    }
    ctx = ctx.withAuthorization(authorization);
    ctx = persistContext(ctx);
    return new RecoveryHandle(ctx);
  },

  getAuthorization(params) {
    const ctx = readContext(requireParams(params), { emitAudit: false });
    if (!ctx) return null;
    if (!ctx.isAuthorizationValid()) {
      if (ctx.authorization) {
        RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_EXPIRED, {
          module: ctx.module,
          operation: ctx.operation,
          entityId: ctx.entityId,
          scope: 'authorization'
        });
      }
      return null;
    }
    return ctx.toLiberacaoCompat();
  },

  async load(params, helpers = {}) {
    const p = requireParams(params);
    const ctx = readContext(p);
    if (!ctx) {
      return { exists: false, context: null, state: null, source: null, error: null };
    }

    try {
      const reconstructed = await RecoveryLoader.reconstruct(ctx, helpers);
      return {
        exists: true,
        context: reconstructed.context,
        state: reconstructed.state,
        source: reconstructed.source,
        error: null
      };
    } catch (error) {
      const operationalMessage = RecoveryMessages.toOperationalMessage(error);
      return {
        exists: true,
        context: ctx,
        state: {
          entity: null,
          checkpoint: ctx.checkpoint || {},
          fromApi: false,
          fromCheckpoint: true,
          authorization: ctx.authorization
        },
        source: 'checkpoint-degraded',
        error: {
          technical: String(error && error.message || error),
          operationalMessage
        }
      };
    }
  },

  async resume(params, helpers = {}) {
    const loaded = await RecoveryManager.load(params, helpers);
    if (!loaded.exists) {
      return loaded;
    }

    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_RESUME, {
      module: loaded.context.module,
      operation: loaded.context.operation,
      entityId: loaded.context.entityId,
      status: loaded.context.status,
      source: loaded.source
    });

    if (!loaded.error) {
      RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_RECOVERED, {
        module: loaded.context.module,
        operation: loaded.context.operation,
        entityId: loaded.context.entityId,
        source: loaded.source
      });
    }

    if (loaded.context?.isAuthorizationValid?.()) {
      RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_AUTH_RESTORED, {
        module: loaded.context.module,
        operation: loaded.context.operation,
        entityId: loaded.context.entityId,
        authorizedBy: loaded.context.authorization?.authorizedBy
      });
    }

    return loaded;
  },

  complete(params, meta = {}) {
    const p = requireParams(params);
    let ctx = readContext(p, { emitAudit: false });
    if (!ctx) {
      ctx = new RecoveryContext({
        module: p.module,
        operation: p.operation,
        entityId: p.entityId,
        status: RecoveryStatus.CONCLUIDO,
        meta
      });
    } else {
      if (ctx.authorization && ctx.authorization.expiresOnComplete !== false) {
        ctx = ctx.clearAuthorization();
      }
      ctx = ctx.withStatus(RecoveryStatus.CONCLUIDO);
      if (meta && Object.keys(meta).length) {
        ctx = new RecoveryContext({ ...ctx.toJSON(), meta: { ...ctx.meta, ...meta }, checksum: null });
      }
    }
    ctx = persistContext(ctx);
    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_COMPLETE, {
      module: ctx.module,
      operation: ctx.operation,
      entityId: ctx.entityId
    });
    return new RecoveryHandle(ctx);
  },

  cancel(params, meta = {}) {
    const p = requireParams(params);
    let ctx = readContext(p, { emitAudit: false });
    if (!ctx) {
      ctx = new RecoveryContext({
        module: p.module,
        operation: p.operation,
        entityId: p.entityId,
        status: RecoveryStatus.CANCELADO,
        meta
      });
    } else {
      ctx = ctx.clearAuthorization().withStatus(RecoveryStatus.CANCELADO);
      if (meta && Object.keys(meta).length) {
        ctx = new RecoveryContext({ ...ctx.toJSON(), meta: { ...ctx.meta, ...meta }, checksum: null });
      }
    }
    ctx = persistContext(ctx);
    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_CANCEL, {
      module: ctx.module,
      operation: ctx.operation,
      entityId: ctx.entityId
    });
    return new RecoveryHandle(ctx);
  },

  exists(params) {
    const ctx = readContext(requireParams(params), { emitAudit: false });
    return Boolean(ctx && isActiveStatus(ctx.status));
  },

  listPending(filter = {}) {
    const all = RecoveryStorage.listAll();
    return all
      .map((row) => {
        const validation = RecoveryValidation.validate(row, { emitAudit: false });
        if (!validation.valid) {
          RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_DISCARDED, {
            module: row.module,
            operation: row.operation,
            entityId: row.entityId,
            reason: validation.reason
          });
          RecoveryStorage.remove(RecoveryStorage.buildKey(row.module, row.operation, row.entityId));
          return null;
        }
        return RecoveryContext.fromJSON(row);
      })
      .filter(Boolean)
      .filter((ctx) => isActiveStatus(ctx.status))
      .filter((ctx) => !filter.module || ctx.module === filter.module)
      .map((ctx) => ctx.toJSON())
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  },

  clear(params) {
    const p = requireParams(params);
    const key = storageKey(p);
    const ok = RecoveryStorage.remove(key);
    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_CLEAR, {
      module: p.module,
      operation: p.operation,
      entityId: p.entityId,
      ok
    });
    return ok;
  },

  rebind(params, newEntityId) {
    const p = requireParams(params);
    const oldKey = storageKey(p);
    const raw = RecoveryStorage.read(oldKey);
    if (!raw) {
      return RecoveryManager.open({ ...p, entityId: newEntityId });
    }
    RecoveryStorage.remove(oldKey);
    let ctx = new RecoveryContext({
      ...raw,
      entityId: newEntityId,
      updatedAt: new Date().toISOString(),
      checksum: null
    });
    if (ctx.authorization) {
      ctx = ctx.withAuthorization({
        ...ctx.authorization,
        consignacaoId: newEntityId
      });
    }
    ctx = persistContext(ctx);
    return new RecoveryHandle(ctx);
  },

  get(params) {
    return readContext(requireParams(params), { emitAudit: false });
  },

  validate(params) {
    const p = requireParams(params);
    const raw = RecoveryStorage.read(storageKey(p));
    return RecoveryValidation.validate(raw || {});
  },

  createDraftEntityId: RecoveryValidation.createDraftEntityId,
  isDraftEntityId: RecoveryValidation.isDraftEntityId,

  Registry: RecoveryRegistry,
  Status: RecoveryStatus,
  Events: RecoveryEvents,
  Messages: RecoveryMessages,
  Validation: RecoveryValidation
};

module.exports = RecoveryManager;
