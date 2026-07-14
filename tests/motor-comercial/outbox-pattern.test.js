/**
 * Testes — Outbox Pattern Motor Comercial (Sprint P-2)
 * Executar: npm run test:motor-comercial-outbox
 */

const assert = require('assert');
const {
  OUTBOX_STATUS,
  criarOutboxConfiguration,
  OutboxDispatcher,
  OutboxProcessor,
  OutboxService
} = require('../../backend/shared/outbox');
const { OUTBOX_EVENT_TYPES } = require('../../backend/motores/motor-comercial/integrations/outbox/OutboxEventTypes');
const { criarComercialOutboxHandlers } = require('../../backend/motores/motor-comercial/integrations/outbox/ComercialOutboxHandlers');
const RegistrarVendaPrestacaoUseCase = require('../../backend/motores/motor-comercial/usecases/consignacao/RegistrarVendaPrestacaoUseCase');
const AbrirPrestacaoUseCase = require('../../backend/motores/motor-comercial/usecases/consignacao/AbrirPrestacaoUseCase');
const { criarMockOutboxService } = require('./outbox-test-helpers');

let passou = 0;
let falhou = 0;

function test(nome, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => { passou += 1; console.log(`  OK  ${nome}`); })
    .catch((err) => { falhou += 1; console.error(`  FALHOU  ${nome}\n         ${err.message}`); });
}

function criarInMemoryOutboxRepository() {
  const store = new Map();
  let seq = 0;

  return {
    store,
    async inserir(evento) {
      const existente = [...store.values()].find((e) => e.idempotencyKey === evento.idempotencyKey);
      if (existente) return existente;

      seq += 1;
      const registro = {
        ...evento,
        id: seq,
        status: OUTBOX_STATUS.PENDING,
        attempts: 0,
        maxAttempts: evento.maxAttempts ?? 5
      };
      store.set(seq, registro);
      return registro;
    },
    async listarPorIds(ids) {
      return ids.map((id) => store.get(id)).filter(Boolean);
    },
    async marcarProcessando(id) {
      const evento = store.get(id);
      if (evento) evento.status = OUTBOX_STATUS.PROCESSING;
      return evento ?? null;
    },
    async marcarConcluido(id, dados = {}) {
      const evento = store.get(id);
      if (evento) {
        evento.status = OUTBOX_STATUS.COMPLETED;
        evento.processedAt = new Date().toISOString();
        evento.durationMs = dados.durationMs ?? null;
      }
      return evento ?? null;
    },
    async marcarFalha(id, dados = {}) {
      const evento = store.get(id);
      if (!evento) return null;
      evento.attempts += 1;
      evento.lastError = dados.erro?.message ?? String(dados.erro);
      evento.status = evento.attempts >= evento.maxAttempts
        ? OUTBOX_STATUS.DEAD_LETTER
        : OUTBOX_STATUS.FAILED;
      return evento;
    },
    async listarPendentes() {
      return [...store.values()].filter((e) => [OUTBOX_STATUS.PENDING, OUTBOX_STATUS.FAILED].includes(e.status));
    },
    async obterStatus() {
      const resumo = { total: store.size, pending: 0, completed: 0, failed: 0, deadLetter: 0 };
      for (const evento of store.values()) {
        if (evento.status === OUTBOX_STATUS.PENDING) resumo.pending += 1;
        if (evento.status === OUTBOX_STATUS.COMPLETED) resumo.completed += 1;
        if (evento.status === OUTBOX_STATUS.FAILED) resumo.failed += 1;
        if (evento.status === OUTBOX_STATUS.DEAD_LETTER) resumo.deadLetter += 1;
      }
      return resumo;
    }
  };
}

function criarOutboxTestStack(bridges = {}) {
  const repository = criarInMemoryOutboxRepository();
  const config = criarOutboxConfiguration({
    maxAttempts: 3,
    initialDelayMs: 1,
    maxDelayMs: 5
  });
  const dispatcher = new OutboxDispatcher({ config });
  dispatcher.registrarHandlers(criarComercialOutboxHandlers(bridges));
  const processor = new OutboxProcessor({ repository, dispatcher, config });
  const service = new OutboxService({ repository, processor, config });
  return { repository, dispatcher, processor, service };
}

function criarConsignacao() {
  return {
    id: 1,
    clienteId: 10,
    perfilComercialId: 5,
    status: 'ENTREGUE',
    documento: { numero: 'C001', serie: '1', sequencial: 1, situacao: 'ATIVO' },
    prestacaoContasAtiva: { id: 'p1', status: 'ABERTA' },
    valorTotalEntregue: 100,
    valorTotalAcertado: 0,
    valorTotalPago: 0,
    saldoAberto: 100
  };
}

function criarItem() {
  return {
    id: 1,
    consignacaoId: 1,
    produtoId: 100,
    quantidadeEntregue: 10,
    quantidadeDevolvida: 0,
    quantidadeVendida: 0,
    quantidadePerdida: 0,
    quantidadeCortesia: 0,
    precoUnitario: 10,
    subtotalEntregue: 100,
    subtotalAcertado: 0
  };
}


async function run() {
  console.log('\n=== Testes Outbox Pattern — Sprint P-2 ===\n');

  await test('Dispatcher — executa handler FinanceiroLancarReceita', async () => {
    const chamadas = [];
    const { dispatcher } = criarOutboxTestStack({
      financeiroBridge: {
        registrarReceitaConsignacao: async (payload) => {
          chamadas.push(payload);
          return { ok: true };
        }
      }
    });

    const resultado = await dispatcher.dispatch({
      id: 1,
      eventType: OUTBOX_EVENT_TYPES.FINANCEIRO_LANCAR_RECEITA,
      bridgeName: 'Financeiro',
      payload: { consignacaoId: 1, valor: 50, correlationId: 'corr-1' },
      correlationId: 'corr-1',
      status: OUTBOX_STATUS.PENDING,
      attempts: 0
    });

    assert.strictEqual(resultado.isOk(), true);
    assert.strictEqual(chamadas.length, 1);
    assert.strictEqual(chamadas[0].consignacaoId, 1);
  });

  await test('Processor — commit → evento registrado → bridge executada → concluído', async () => {
    const chamadas = [];
    const { repository, processor } = criarOutboxTestStack({
      financeiroBridge: {
        registrarReceitaConsignacao: async (payload) => {
          chamadas.push(payload);
          return { ok: true };
        }
      }
    });

    const evento = await repository.inserir({
      eventType: OUTBOX_EVENT_TYPES.FINANCEIRO_LANCAR_RECEITA,
      bridgeName: 'Financeiro',
      payload: { consignacaoId: 1, valor: 20, correlationId: 'corr-2' },
      correlationId: 'corr-2',
      idempotencyKey: `${OUTBOX_EVENT_TYPES.FINANCEIRO_LANCAR_RECEITA}:corr-2`
    });

    await processor.processarPorIds([evento.id]);

    const atualizado = repository.store.get(evento.id);
    assert.strictEqual(atualizado.status, OUTBOX_STATUS.COMPLETED);
    assert.strictEqual(chamadas.length, 1);
  });

  await test('Processor — falha com retry e conclusão', async () => {
    let tentativas = 0;
    const { repository, processor } = criarOutboxTestStack({
      financeiroBridge: {
        registrarReceitaConsignacao: async () => {
          tentativas += 1;
          if (tentativas < 2) {
            const erro = new Error('network timeout');
            erro.code = 'ETIMEDOUT';
            throw erro;
          }
          return { ok: true };
        }
      }
    });

    const evento = await repository.inserir({
      eventType: OUTBOX_EVENT_TYPES.FINANCEIRO_LANCAR_RECEITA,
      bridgeName: 'Financeiro',
      payload: { consignacaoId: 1, correlationId: 'corr-retry' },
      correlationId: 'corr-retry',
      idempotencyKey: `${OUTBOX_EVENT_TYPES.FINANCEIRO_LANCAR_RECEITA}:corr-retry`
    });

    await processor.processarPorIds([evento.id]);
    assert.ok(tentativas >= 2);
    assert.strictEqual(repository.store.get(evento.id).status, OUTBOX_STATUS.COMPLETED);
  });

  await test('Idempotência — mesmo correlationId não reprocessa evento concluído', async () => {
    let chamadas = 0;
    const { repository, dispatcher } = criarOutboxTestStack({
      financeiroBridge: {
        registrarReceitaConsignacao: async () => {
          chamadas += 1;
          return { ok: true };
        }
      }
    });

    const evento = await repository.inserir({
      eventType: OUTBOX_EVENT_TYPES.FINANCEIRO_LANCAR_RECEITA,
      bridgeName: 'Financeiro',
      payload: { consignacaoId: 1, correlationId: 'corr-idem' },
      correlationId: 'corr-idem',
      idempotencyKey: `${OUTBOX_EVENT_TYPES.FINANCEIRO_LANCAR_RECEITA}:corr-idem`
    });

    evento.status = OUTBOX_STATUS.COMPLETED;
    repository.store.set(evento.id, evento);

    const resultado = await dispatcher.dispatch(evento);
    assert.strictEqual(resultado.isOk(), true);
    assert.strictEqual(chamadas, 0);
  });

  await test('Use Case — venda (STAB-06) mantém ledger sem outbox financeiro espelhado', async () => {
    const chamadas = [];
    const financeiroBridge = {
      registrarReceitaConsignacao: async (payload) => {
        chamadas.push(payload);
        return { ok: true };
      }
    };
    const outboxService = criarMockOutboxService({ financeiroBridge });

    const consignacao = {
      id: 1,
      clienteId: 10,
      perfilComercialId: 5,
      status: 'ENTREGUE',
      documento: { numero: 'C001', serie: '1', sequencial: 1, situacao: 'ATIVO' },
      prestacaoContasAtiva: null,
      valorTotalEntregue: 100,
      valorTotalAcertado: 0,
      valorTotalPago: 0,
      saldoAberto: 100
    };

    let consignacaoStore = { ...consignacao };
    const consignacaoRepo = {
      buscarPorId: async () => ({ ...consignacaoStore, prestacaoContasAtiva: consignacaoStore.prestacaoContasAtiva ? { ...consignacaoStore.prestacaoContasAtiva } : null }),
      listar: async () => [{ ...consignacaoStore }],
      atualizar: async (id, dados) => {
        const patch = { ...dados };
        if (patch.prestacaoContasAtiva) {
          consignacaoStore.prestacaoContasAtiva = { ...patch.prestacaoContasAtiva };
          delete patch.prestacaoContasAtiva;
        }
        consignacaoStore = { ...consignacaoStore, ...patch };
        return { ...consignacaoStore, prestacaoContasAtiva: consignacaoStore.prestacaoContasAtiva ? { ...consignacaoStore.prestacaoContasAtiva } : null };
      }
    };

    const item = criarItem();
    const itemRepo = {
      buscarPorId: async () => ({ ...item }),
      listarPorConsignacao: async () => [{ ...item }],
      atualizar: async (id, dados) => ({ ...item, ...dados })
    };

    const perfilRepo = {
      buscarPorId: async () => ({ id: 5, limiteComercial: 10000, saldoAberto: 100 }),
      atualizar: async (id, dados) => ({ id, ...dados })
    };

    const movimentacoes = [{
      id: 1,
      consignacaoId: 1,
      tipoMovimentacao: 'ENTREGA',
      valor: 100,
      dataMovimentacao: '2026-06-01T09:00:00.000Z'
    }];
    const movRepo = {
      inserir: async (dados) => {
        const mov = { id: movimentacoes.length + 1, ...dados };
        movimentacoes.push(mov);
        return mov;
      },
      listar: async () => movimentacoes
    };

    const uow = {
      consignacao: consignacaoRepo,
      consignacaoItem: itemRepo,
      perfilComercial: perfilRepo,
      movimentacaoComercial: movRepo,
      executar: async (fn) => fn(uow)
    };

    const publisher = { publicados: [], publicar: (e) => publisher.publicados.push(e), flush: async () => {} };
    const deps = { unitOfWork: uow, eventPublisher: publisher, outboxService };

    await new AbrirPrestacaoUseCase(deps).executar({ consignacaoId: 1, correlationId: 'corr-abertura-outbox' });

    const result = await new RegistrarVendaPrestacaoUseCase(deps).executar({
      consignacaoId: 1,
      produtoId: 100,
      quantidade: 2,
      correlationId: 'corr-uc-venda'
    });

    assert.strictEqual(result.isOk(), true, result.erro?.message ?? result.erro?.codigo);
    // STAB-06: receita oficial no criarVenda — sem bridge FinanceiroLancarReceita na grade
    assert.strictEqual(chamadas.length, 0);
  });

  console.log(`\n--- Resultado: ${passou} passou, ${falhou} falhou ---\n`);
  if (falhou > 0) process.exit(1);
}

run();
