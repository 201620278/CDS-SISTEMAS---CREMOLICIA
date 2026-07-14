/**
 * HOTFIX — Recovery reconstrói Entrega via API de itens (sem depender só do checkpoint)
 */

const { RecoveryManager, RecoveryRegistry, RecoveryStatus, RecoveryStorage, RecoveryEvents } = require('../../../../shared/recovery');
const {
  ensureRegistered,
  MODULE_ID,
  Operations,
  saveEntrega,
  savePrepararEntrega
} = require('../../recovery');
const { carregarConsignacaoCompleta } = require('../../utils/operacional');

function installMemoryStorage() {
  const memory = new Map();
  global.localStorage = {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => { memory.set(k, String(v)); },
    removeItem: (k) => { memory.delete(k); },
    clear: () => memory.clear()
  };
  global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };
}

describe('HOTFIX recuperação consignação interrompida', () => {
  beforeEach(() => {
    installMemoryStorage();
    RecoveryRegistry.reset();
    RecoveryEvents.clearAuditLog();
    RecoveryStorage.clearAll();
    ensureRegistered();
  });

  test('Entrega conclui checklist com itens vindos só da API (sem checkpoint)', async () => {
    const consignacaoId = 9001;
    const api = {
      obterConsignacao: jest.fn(async () => ({
        id: consignacaoId,
        status: 'RASCUNHO',
        clienteId: 12,
        perfilComercialId: 3,
        documento: { numero: 'CONS-2026-000042' },
        itens: [
          { id: 1, produtoId: 10, quantidade: 5, precoUnitario: 2 }
        ]
      })),
      obterPerfil: jest.fn(async () => ({
        perfilTipo: 'CONSIGNADO',
        ativo: true,
        bloqueado: false,
        limiteComercial: 1000
      })),
      listarItensConsignacao: jest.fn(async () => [
        { id: 1, produtoId: 10, quantidade: 5, precoUnitario: 2 }
      ])
    };
    const projectionApi = {
      obterSituacaoCliente: jest.fn(async () => ({
        clienteNome: 'Cliente H',
        limiteDisponivel: 1000,
        saldoEmAberto: 0
      })),
      obterResumoPrestacao: jest.fn(async () => ({ itens: [], saldoAtual: 0, limiteDisponivel: 1000 }))
    };

    // Sem checkpoint — simula fechar ERP com localStorage limpo / outro browser
    const view = await carregarConsignacaoCompleta(api, projectionApi, consignacaoId);

    expect(view.status).toBe('RASCUNHO');
    expect(view.itens.length).toBeGreaterThan(0);
    expect(view.documento).toBeTruthy();

    const total = view.itens.reduce(
      (s, i) => s + Number(i.quantidade) * Number(i.preco || i.precoUnitario || 0),
      0
    );
    expect(total).toBe(10);

    // Recovery resume + save não apaga itens
    await RecoveryManager.resume({
      module: MODULE_ID,
      operation: Operations.ENTREGA,
      entityId: consignacaoId
    }, { api, projectionApi });

    saveEntrega(consignacaoId, {
      itens: view.itens,
      statusConsignacao: view.status,
      clienteId: view.clienteId
    }, RecoveryStatus.AGUARDANDO_CONFIRMACAO);

    const ctx = RecoveryManager.get({
      module: MODULE_ID,
      operation: Operations.ENTREGA,
      entityId: consignacaoId
    });
    expect(ctx.checkpoint.itens.length).toBeGreaterThan(0);
  });

  test('saveEntrega não sobrescreve itens com array vazio', () => {
    const id = 9002;
    savePrepararEntrega({
      consignacaoId: id,
      currentStep: 2,
      data: {
        clienteId: 1,
        itens: [{ produtoId: 7, quantidade: 2, preco: 3 }]
      }
    }, RecoveryStatus.AGUARDANDO_CONFIRMACAO);

    saveEntrega(id, {
      itens: [{ produtoId: 7, quantidade: 2, preco: 3 }]
    }, RecoveryStatus.AGUARDANDO_CONFIRMACAO);

    // Load parcial “sem itens” não pode limpar o checkpoint
    saveEntrega(id, {
      itens: [],
      statusConsignacao: 'RASCUNHO'
    }, RecoveryStatus.AGUARDANDO_CONFIRMACAO);

    const ctx = RecoveryManager.get({
      module: MODULE_ID,
      operation: Operations.ENTREGA,
      entityId: id
    });
    expect(ctx.checkpoint.itens).toHaveLength(1);
    expect(ctx.checkpoint.itens[0].produtoId).toBe(7);
  });

  test('fallback listarItensConsignacao quando GET cabeçalho vem sem itens', async () => {
    const api = {
      obterConsignacao: jest.fn(async () => ({
        id: 55,
        status: 'RASCUNHO',
        clienteId: 1,
        perfilComercialId: 1,
        documento: 'CONS-1',
        itens: []
      })),
      obterPerfil: jest.fn(async () => ({ ativo: true, bloqueado: false, perfilTipo: 'CONSIGNADO', limiteComercial: 500 })),
      listarItensConsignacao: jest.fn(async () => [
        { id: 9, produtoId: 3, quantidade: 4, precoUnitario: 1.25 }
      ])
    };
    const projectionApi = {
      obterSituacaoCliente: async () => ({ clienteNome: 'A', limiteDisponivel: 500 }),
      obterResumoPrestacao: async () => ({ itens: [] })
    };

    const view = await carregarConsignacaoCompleta(api, projectionApi, 55);
    expect(api.listarItensConsignacao).toHaveBeenCalledWith(55);
    expect(view.itens).toHaveLength(1);
    expect(view.itens[0].produtoId).toBe(3);
  });
});
