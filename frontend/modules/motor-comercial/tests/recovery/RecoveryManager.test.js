/**
 * Recovery Framework — testes unitários (Fase 1)
 */

const {
  RecoveryManager,
  RecoveryRegistry,
  RecoveryStatus,
  RecoveryStorage,
  RecoveryEvents
} = require('../../../../shared/recovery');

describe('CDS Recovery Framework', () => {
  const memory = new Map();

  beforeEach(() => {
    memory.clear();
    RecoveryRegistry.reset();
    RecoveryEvents.clearAuditLog();

    global.localStorage = {
      getItem: (k) => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => { memory.set(k, String(v)); },
      removeItem: (k) => { memory.delete(k); },
      clear: () => memory.clear()
    };

    RecoveryStorage.clearAll();
  });

  test('open/save/exists/listPending/complete', () => {
    const handle = RecoveryManager.open({
      module: 'motor-comercial',
      operation: 'PREPARAR_ENTREGA',
      entityId: 42
    });

    expect(handle.context.status).toBe(RecoveryStatus.NOVO);
    handle.save({ step: 1, itens: [{ produtoId: 1, quantidade: 2 }] }, RecoveryStatus.EM_ANDAMENTO);

    expect(RecoveryManager.exists({
      module: 'motor-comercial',
      operation: 'PREPARAR_ENTREGA',
      entityId: 42
    })).toBe(true);

    const pending = RecoveryManager.listPending({ module: 'motor-comercial' });
    expect(pending).toHaveLength(1);
    expect(pending[0].checkpoint.itens).toHaveLength(1);

    RecoveryManager.complete({
      module: 'motor-comercial',
      operation: 'PREPARAR_ENTREGA',
      entityId: 42
    });

    expect(RecoveryManager.exists({
      module: 'motor-comercial',
      operation: 'PREPARAR_ENTREGA',
      entityId: 42
    })).toBe(false);

    expect(RecoveryManager.listPending({ module: 'motor-comercial' })).toHaveLength(0);
  });

  test('resume usa loader registrado (API-first)', async () => {
    RecoveryRegistry.registerModule('motor-comercial', ['ENTREGA']);
    RecoveryRegistry.registerLoader('motor-comercial', 'ENTREGA', async (ctx, helpers) => {
      const entity = await helpers.api.obterConsignacao(ctx.entityId);
      return {
        entity: { ...entity, itens: ctx.checkpoint.itens || [] },
        checkpoint: ctx.checkpoint,
        fromApi: true,
        fromCheckpoint: true,
        source: 'api+checkpoint'
      };
    });

    RecoveryManager.open({
      module: 'motor-comercial',
      operation: 'ENTREGA',
      entityId: 7
    }).save({ itens: [{ produtoId: 9 }] }, RecoveryStatus.AGUARDANDO_CONFIRMACAO);

    const result = await RecoveryManager.resume(
      { module: 'motor-comercial', operation: 'ENTREGA', entityId: 7 },
      {
        api: {
          obterConsignacao: async (id) => ({ id, status: 'RASCUNHO', itens: [] })
        }
      }
    );

    expect(result.exists).toBe(true);
    expect(result.state.fromApi).toBe(true);
    expect(result.state.entity.itens[0].produtoId).toBe(9);
    expect(result.source).toBe('api+checkpoint');
  });

  test('emite eventos de auditoria RECOVERY_*', () => {
    RecoveryManager.open({
      module: 'nfe',
      operation: 'NFE',
      entityId: 'x1'
    });
    RecoveryManager.save(
      { module: 'nfe', operation: 'NFE', entityId: 'x1' },
      { draft: true }
    );
    RecoveryManager.cancel({ module: 'nfe', operation: 'NFE', entityId: 'x1' });

    const types = RecoveryEvents.getAuditLog().map((e) => e.type);
    expect(types).toContain('RECOVERY_OPEN');
    expect(types).toContain('RECOVERY_SAVE');
    expect(types).toContain('RECOVERY_CANCEL');
  });

  test('não depende de sessionStorage', () => {
    delete global.sessionStorage;
    RecoveryManager.open({
      module: 'motor-comercial',
      operation: 'PREPARAR_ENTREGA',
      entityId: 1
    }).save({ itens: [{ produtoId: 3 }] });

    const ctx = RecoveryManager.get({
      module: 'motor-comercial',
      operation: 'PREPARAR_ENTREGA',
      entityId: 1
    });
    expect(ctx.checkpoint.itens[0].produtoId).toBe(3);
  });
});
