/**
 * CDS Recovery Framework — Reconstrução via loaders (API-first)
 *
 * @module frontend/shared/recovery/RecoveryLoader
 */

const RecoveryRegistry = require('./RecoveryRegistry');
const RecoveryEvents = require('./RecoveryEvents');
const RecoveryMessages = require('./RecoveryMessages');
const RecoveryValidation = require('./RecoveryValidation');

async function reconstruct(context, helpers = {}) {
  if (!context) {
    throw RecoveryMessages.createOperationalError('NOT_RESUMABLE');
  }

  const loader = RecoveryRegistry.getLoader(context.module, context.operation);
  if (!loader) {
    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_LOAD, {
      module: context.module,
      operation: context.operation,
      entityId: context.entityId,
      ok: false,
      reason: 'LOADER_NAO_REGISTRADO'
    });
    return {
      context,
      state: {
        entity: null,
        checkpoint: context.checkpoint || {},
        fromApi: false,
        fromCheckpoint: Boolean(context.checkpoint && Object.keys(context.checkpoint).length),
        authorization: context.authorization
      },
      source: 'checkpoint-only'
    };
  }

  try {
    const result = await loader(context, helpers);
    const normalized = normalizeResult(context, result);

    RecoveryEvents.emit(RecoveryEvents.EVENT_TYPES.RECOVERY_LOAD, {
      module: context.module,
      operation: context.operation,
      entityId: context.entityId,
      ok: true,
      source: normalized.source
    });

    return normalized;
  } catch (error) {
    // Draft: sem API — checkpoint é fonte válida
    if (RecoveryValidation.isDraftEntityId(context.entityId)) {
      return {
        context,
        state: {
          entity: buildDraftEntity(context),
          checkpoint: context.checkpoint || {},
          fromApi: false,
          fromCheckpoint: true,
          authorization: context.authorization
        },
        source: 'checkpoint'
      };
    }
    throw error;
  }
}

function buildDraftEntity(context) {
  const cp = context.checkpoint || {};
  return {
    id: context.entityId,
    status: 'RASCUNHO',
    clienteId: cp.clienteId || null,
    perfilComercialId: cp.perfilComercialId || null,
    documento: cp.documentoNumero || null,
    documentoExterno: cp.documentoExterno || '',
    observacao: cp.observacoes || '',
    dataAbertura: cp.data || null,
    dataEntregaPrevista: cp.dataPrevista || null,
    itens: Array.isArray(cp.itens) ? cp.itens : [],
    _draft: true
  };
}

function normalizeResult(context, result) {
  if (!result || typeof result !== 'object') {
    return {
      context,
      state: {
        entity: null,
        checkpoint: context.checkpoint || {},
        fromApi: false,
        fromCheckpoint: true,
        authorization: context.authorization
      },
      source: 'empty'
    };
  }

  return {
    context: result.context || context,
    state: {
      entity: result.entity != null ? result.entity : null,
      checkpoint: result.checkpoint != null ? result.checkpoint : (context.checkpoint || {}),
      fromApi: Boolean(result.fromApi),
      fromCheckpoint: Boolean(result.fromCheckpoint),
      authorization: context.authorization,
      extras: result.extras || {}
    },
    source: result.source || (result.fromApi ? 'api+checkpoint' : 'checkpoint')
  };
}

module.exports = {
  reconstruct,
  normalizeResult,
  buildDraftEntity
};
