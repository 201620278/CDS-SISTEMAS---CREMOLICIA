/**
 * Testes — Use Cases Consignacao Fase 2 (Sprint 2.4.2)
 * Executar: npm run test:motor-comercial-consignacao-fase2
 */

const assert = require('assert');
const {
  ValidarEntregaConsignacaoUseCase,
  RegistrarEntregaConsignacaoUseCase,
  RegistrarDevolucaoAntesPrestacaoUseCase,
  TransferirItensEntreConsignacoesUseCase,
  ConfirmarRecebimentoConsignacaoUseCase,
  ConsultarOperacaoConsignacaoUseCase,
  ConsultarMovimentacoesConsignacaoUseCase,
  ConsultarConsignacoesEmTransitoUseCase
} = require('../../backend/motores/motor-comercial/usecases/consignacao');
const { EVENTOS_DOMINIO } = require('../../backend/motores/motor-comercial/events/comercialEventosTipos');
const { criarMockOutboxService, adaptarUowParaOutbox } = require('./outbox-test-helpers');

let passou = 0;
let falhou = 0;

function test(nome, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => { passou += 1; console.log(`  OK  ${nome}`); })
    .catch((err) => { falhou += 1; console.error(`  FALHOU  ${nome}\n         ${err.message}`); });
}

function criarConsignacao(overrides = {}) {
  return {
    id: 1,
    clienteId: 10,
    perfilComercialId: 5,
    status: 'RASCUNHO',
    documento: { numero: 'C001', serie: '1', sequencial: 1, situacao: 'RASCUNHO' },
    prestacaoContasAtiva: null,
    valorTotalEntregue: 0,
    saldoAberto: 0,
    dataAbertura: '2026-06-01T10:00:00.000Z',
    ...overrides
  };
}

function criarItem(overrides = {}) {
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
    ...overrides
  };
}

function criarPerfil(overrides = {}) {
  return {
    id: 5,
    clienteId: 10,
    perfilTipo: 'CONSIGNADO',
    ativo: true,
    bloqueado: false,
    limiteComercial: 10000,
    saldoAberto: 0,
    ...overrides
  };
}

function criarMockConsignacaoRepo(estadoInicial = null) {
  let store = estadoInicial ? { ...estadoInicial } : null;
  const todos = estadoInicial ? [{ ...estadoInicial }] : [];
  return {
    buscarPorId: async (id) => (store?.id === id ? { ...store } : todos.find((c) => c.id === id) ?? null),
    listar: async (filtros = {}) => todos.filter((c) => {
      if (filtros.clienteId != null && c.clienteId !== filtros.clienteId) return false;
      if (filtros.status && c.status !== filtros.status) return false;
      if (filtros.perfilComercialId != null && c.perfilComercialId !== filtros.perfilComercialId) return false;
      return true;
    }),
    inserir: async (dados) => {
      store = { id: todos.length + 1, ...dados };
      todos.push({ ...store });
      return { ...store };
    },
    atualizar: async (id, dados) => {
      const idx = todos.findIndex((c) => c.id === id);
      const base = idx >= 0 ? todos[idx] : store;
      if (!base) return null;
      if (dados.documento) {
        base.documento = { ...base.documento, ...dados.documento };
        delete dados.documento;
      }
      const atualizado = { ...base, ...dados };
      if (idx >= 0) todos[idx] = atualizado;
      if (store?.id === id) store = atualizado;
      return { ...atualizado };
    },
    todos,
    get store() { return store; }
  };
}

function criarMockItemRepo(itensIniciais = []) {
  const itens = itensIniciais.map((i) => ({ ...i }));
  let seq = itens.length;
  return {
    buscarPorId: async (id) => itens.find((i) => i.id === id) ?? null,
    listarPorConsignacao: async (consignacaoId, filtros = {}) => itens.filter((i) => {
      if (i.consignacaoId !== consignacaoId) return false;
      if (filtros.produtoId != null && i.produtoId !== filtros.produtoId) return false;
      return true;
    }),
    inserir: async (dados) => {
      seq += 1;
      const item = { id: seq, ...dados };
      itens.push(item);
      return item;
    },
    atualizar: async (id, dados) => {
      const idx = itens.findIndex((i) => i.id === id);
      if (idx < 0) return null;
      itens[idx] = { ...itens[idx], ...dados };
      return itens[idx];
    },
    remover: async (id) => {
      const idx = itens.findIndex((i) => i.id === id);
      if (idx < 0) return false;
      itens.splice(idx, 1);
      return true;
    },
    itens
  };
}

function criarMockPerfilRepo(perfil = criarPerfil()) {
  let store = { ...perfil };
  return {
    buscarPorId: async (id) => (store.id === id ? { ...store } : null),
    atualizar: async (id, dados) => {
      if (store.id !== id) return null;
      store = { ...store, ...dados };
      return { ...store };
    },
    get store() { return store; }
  };
}

function criarMockMovRepo() {
  const movimentacoes = [];
  return {
    inserir: async (dados) => {
      const mov = { id: movimentacoes.length + 1, ...dados };
      movimentacoes.push(mov);
      return mov;
    },
    listar: async (filtros = {}) => movimentacoes.filter((m) => {
      if (filtros.consignacaoId != null && m.consignacaoId !== filtros.consignacaoId) return false;
      return true;
    }),
    movimentacoes
  };
}

function criarMockUow(consignacaoRepo, itemRepo, perfilRepo, movRepo, opcoes = {}) {
  const uow = {
    consignacao: consignacaoRepo,
    consignacaoItem: itemRepo,
    perfilComercial: perfilRepo,
    movimentacaoComercial: movRepo,
    executar: async (fn) => {
      if (opcoes.falhar) throw new Error('rollback');
      return fn(uow);
    }
  };
  return uow;
}

function criarDepsOperacao(consignacaoRepo, itemRepo, perfilRepo, movRepo, extras = {}) {
  const publisher = { publicados: [], publicar: (e) => publisher.publicados.push(e), flush: async () => {} };
  const estoqueBridge = extras.estoqueBridge ?? {
    registrarSaidaConsignacao: async () => ({ ok: true }),
    registrarEntradaConsignacao: async () => ({ ok: true }),
    registrarTransferencia: async () => ({ ok: true })
  };
  const outboxService = criarMockOutboxService({ estoqueBridge });
  const uow = criarMockUow(consignacaoRepo, itemRepo, perfilRepo, movRepo, extras);
  adaptarUowParaOutbox(uow, outboxService);

  return {
    unitOfWork: uow,
    eventPublisher: publisher,
    consignacaoRepository: consignacaoRepo,
    consignacaoItemRepository: itemRepo,
    perfilComercialRepository: perfilRepo,
    movimentacaoComercialRepository: movRepo,
    clienteBridge: extras.clienteBridge ?? {
      buscarPorId: async () => ({ id: 10 }),
      estaAtivo: async () => true
    },
    estoqueBridge,
    outboxService,
    publisher
  };
}

async function run() {
  console.log('\n=== Testes Use Cases Consignacao Fase 2 — Sprint 2.4.2 ===\n');

  await test('UC-018 ValidarEntrega — válida', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao());
    const itemRepo = criarMockItemRepo([criarItem()]);
    const deps = {
      consignacaoRepository: consignacaoRepo,
      consignacaoItemRepository: itemRepo,
      perfilComercialRepository: criarMockPerfilRepo(),
      clienteBridge: { buscarPorId: async () => ({}), estaAtivo: async () => true }
    };
    const result = await new ValidarEntregaConsignacaoUseCase(deps).executar({ consignacaoId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.valido, true);
  });

  await test('UC-011 RegistrarEntrega — gera ENTREGA e consome limite', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao());
    const itemRepo = criarMockItemRepo([criarItem()]);
    const perfilRepo = criarMockPerfilRepo();
    const movRepo = criarMockMovRepo();
    const deps = criarDepsOperacao(consignacaoRepo, itemRepo, perfilRepo, movRepo);

    const result = await new RegistrarEntregaConsignacaoUseCase(deps).executar({ consignacaoId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.consignacao.status, 'ENTREGUE');
    assert.strictEqual(movRepo.movimentacoes.length, 1);
    assert.strictEqual(movRepo.movimentacoes[0].tipoMovimentacao, 'ENTREGA');
    assert.strictEqual(perfilRepo.store.saldoAberto, 100);
    assert.strictEqual(deps.publisher.publicados[0].tipo, EVENTOS_DOMINIO.CONSIGNACAO_ENTREGUE);
    assert.ok(
      deps.publisher.publicados.some((e) => e.tipo === EVENTOS_DOMINIO.CREDITO_COMERCIAL_RECALCULADO),
      'deve emitir CREDITO_COMERCIAL_RECALCULADO'
    );
  });

  await test('UC-011 RegistrarEntrega — outbox pós-commit falho ainda retorna OK', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao());
    const itemRepo = criarMockItemRepo([criarItem()]);
    const deps = criarDepsOperacao(
      consignacaoRepo,
      itemRepo,
      criarMockPerfilRepo(),
      criarMockMovRepo()
    );
    let outboxChamado = false;
    deps.outboxService.processarAposCommit = async () => {
      outboxChamado = true;
      throw new Error('DEAD_LETTER simulado');
    };

    const result = await new RegistrarEntregaConsignacaoUseCase(deps).executar({ consignacaoId: 1 });
    assert.strictEqual(result.isOk(), true, result.erro?.message);
    assert.strictEqual(consignacaoRepo.store.status, 'ENTREGUE');

    // Outbox é agendado async — não bloqueia a resposta.
    await new Promise((resolve) => setImmediate(resolve));
    assert.strictEqual(outboxChamado, true, 'outbox deve ser disparado em background');
  });

  await test('UC-011 RegistrarEntrega — limite insuficiente', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao());
    const itemRepo = criarMockItemRepo([criarItem({ quantidadeEntregue: 100, precoUnitario: 100 })]);
    const deps = criarDepsOperacao(
      consignacaoRepo,
      itemRepo,
      criarMockPerfilRepo({ limiteComercial: 1000, saldoAberto: 0 }),
      criarMockMovRepo()
    );
    const result = await new RegistrarEntregaConsignacaoUseCase(deps).executar({ consignacaoId: 1 });
    assert.strictEqual(result.isFail(), true);
  });

  await test('UC-012 Devolucao — libera limite e registra DEVOLUCAO', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao({
      status: 'ENTREGUE',
      valorTotalEntregue: 100,
      saldoAberto: 100
    }));
    const itemRepo = criarMockItemRepo([criarItem()]);
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ saldoAberto: 100 }));
    const movRepo = criarMockMovRepo();
    movRepo.movimentacoes.push({
      id: 1,
      consignacaoId: 1,
      tipoMovimentacao: 'ENTREGA',
      valor: 100,
      dataMovimentacao: '2026-06-01T09:00:00.000Z'
    });
    const deps = criarDepsOperacao(consignacaoRepo, itemRepo, perfilRepo, movRepo);

    const result = await new RegistrarDevolucaoAntesPrestacaoUseCase(deps).executar({
      consignacaoId: 1,
      itemId: 1,
      quantidade: 3
    });
    assert.strictEqual(result.isOk(), true);
    assert.ok(movRepo.movimentacoes.some((m) => m.tipoMovimentacao === 'DEVOLUCAO'));
    assert.strictEqual(perfilRepo.store.saldoAberto, 70);
    assert.strictEqual(deps.publisher.publicados[0].tipo, EVENTOS_DOMINIO.CONSIGNACAO_DEVOLVIDA);
    assert.ok(
      deps.publisher.publicados.some((e) => e.tipo === EVENTOS_DOMINIO.CREDITO_COMERCIAL_RECALCULADO),
      'deve emitir CREDITO_COMERCIAL_RECALCULADO'
    );
  });

  await test('UC-012 Devolucao — permite com prestação ABERTA e vincula grupo', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao({
      status: 'ENTREGUE',
      valorTotalEntregue: 100,
      saldoAberto: 100,
      prestacaoContasAtiva: { id: 'p-aberta-1', status: 'ABERTA' }
    }));
    const itemRepo = criarMockItemRepo([criarItem({
      quantidadeEntregue: 10,
      quantidadeVendida: 6,
      quantidadeDevolvida: 0
    })]);
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ saldoAberto: 100 }));
    const movRepo = criarMockMovRepo();
    movRepo.movimentacoes.push({
      id: 1,
      consignacaoId: 1,
      tipoMovimentacao: 'ENTREGA',
      valor: 100,
      dataMovimentacao: '2026-06-01T09:00:00.000Z'
    });
    const deps = criarDepsOperacao(consignacaoRepo, itemRepo, perfilRepo, movRepo);

    const result = await new RegistrarDevolucaoAntesPrestacaoUseCase(deps).executar({
      consignacaoId: 1,
      itemId: 1,
      quantidade: 4
    });
    assert.strictEqual(result.isOk(), true, result.erro?.message);
    const devolucao = movRepo.movimentacoes.find((m) => m.tipoMovimentacao === 'DEVOLUCAO');
    assert.ok(devolucao, 'deve registrar DEVOLUCAO');
    assert.strictEqual(devolucao.grupoPrestacaoContasId, 'p-aberta-1');
    assert.strictEqual(itemRepo.itens[0].quantidadeDevolvida, 4);
  });

  await test('UC-012 Devolucao — bloqueia com prestação FECHADA', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao({
      status: 'ENTREGUE',
      prestacaoContasAtiva: { id: 'p-fechada-1', status: 'FECHADA' }
    }));
    const deps = criarDepsOperacao(
      consignacaoRepo,
      criarMockItemRepo([criarItem()]),
      criarMockPerfilRepo(),
      criarMockMovRepo()
    );
    const result = await new RegistrarDevolucaoAntesPrestacaoUseCase(deps).executar({
      consignacaoId: 1,
      itemId: 1,
      quantidade: 1
    });
    assert.strictEqual(result.isFail(), true);
    assert.match(String(result.erro?.message || ''), /prestação fechada/i);
  });

  await test('UC-013 Transferencia — duas movimentações mesmo correlationId', async () => {
    const origem = criarConsignacao({ id: 1, status: 'ENTREGUE', saldoAberto: 100 });
    const destino = criarConsignacao({ id: 2, status: 'ENTREGUE', saldoAberto: 50 });
    const consignacaoRepo = criarMockConsignacaoRepo(origem);
    consignacaoRepo.todos.push({ ...destino });
    const itemRepo = criarMockItemRepo([
      criarItem({ id: 1, consignacaoId: 1, produtoId: 100, quantidadeEntregue: 10 })
    ]);
    const movRepo = criarMockMovRepo();
    const deps = criarDepsOperacao(
      consignacaoRepo,
      itemRepo,
      criarMockPerfilRepo(),
      movRepo
    );

    const result = await new TransferirItensEntreConsignacoesUseCase(deps).executar({
      consignacaoOrigemId: 1,
      consignacaoDestinoId: 2,
      itens: [{ produtoId: 100, quantidade: 4 }],
      correlationId: 'corr-transfer-1'
    });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(movRepo.movimentacoes.length, 2);
    assert.strictEqual(movRepo.movimentacoes[0].tipoMovimentacao, 'TRANSFERENCIA_SAIDA');
    assert.strictEqual(movRepo.movimentacoes[1].tipoMovimentacao, 'TRANSFERENCIA_ENTRADA');
    assert.strictEqual(movRepo.movimentacoes[0].correlationId, 'corr-transfer-1');
  });

  await test('UC-014 ConfirmarRecebimento — apenas evento', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao({ status: 'ENTREGUE' }));
    const deps = criarDepsOperacao(consignacaoRepo, criarMockItemRepo(), criarMockPerfilRepo(), criarMockMovRepo());
    const result = await new ConfirmarRecebimentoConsignacaoUseCase(deps).executar({ consignacaoId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(deps.publisher.publicados[0].tipo, EVENTOS_DOMINIO.RECEBIMENTO_CONSIGNACAO_CONFIRMADO);
  });

  await test('UC-015 ConsultarOperacao — retorna status e última movimentação', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao({ status: 'ENTREGUE' }));
    const movRepo = criarMockMovRepo();
    movRepo.movimentacoes.push({ id: 1, consignacaoId: 1, tipoMovimentacao: 'ENTREGA' });
    const deps = {
      consignacaoRepository: consignacaoRepo,
      consignacaoItemRepository: criarMockItemRepo(),
      movimentacaoComercialRepository: movRepo
    };
    const result = await new ConsultarOperacaoConsignacaoUseCase(deps).executar({ consignacaoId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.status, 'ENTREGUE');
    assert.strictEqual(result.dados.ultimaMovimentacao.tipoMovimentacao, 'ENTREGA');
  });

  await test('UC-016 ConsultarMovimentacoes — ledger exclusivo', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao({ status: 'ENTREGUE' }));
    const movRepo = criarMockMovRepo();
    movRepo.movimentacoes.push({ id: 1, consignacaoId: 1, tipoMovimentacao: 'ENTREGA' });
    const deps = {
      consignacaoRepository: consignacaoRepo,
      consignacaoItemRepository: criarMockItemRepo(),
      movimentacaoComercialRepository: movRepo
    };
    const result = await new ConsultarMovimentacoesConsignacaoUseCase(deps).executar({ consignacaoId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.total, 1);
  });

  await test('UC-017 EmTransito — ENTREGUE sem prestação', async () => {
    const repo = criarMockConsignacaoRepo(criarConsignacao({ id: 1, status: 'ENTREGUE' }));
    repo.todos.push(criarConsignacao({
      id: 2,
      status: 'ENTREGUE',
      prestacaoContasAtiva: { id: 'p1', status: 'ABERTA' }
    }));
    const deps = { consignacaoRepository: repo, consignacaoItemRepository: criarMockItemRepo() };
    const result = await new ConsultarConsignacoesEmTransitoUseCase(deps).executar({});
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.total, 1);
  });

  await test('Rollback entrega — sem eventos', async () => {
    const consignacaoRepo = criarMockConsignacaoRepo(criarConsignacao());
    const itemRepo = criarMockItemRepo([criarItem()]);
    const deps = criarDepsOperacao(
      consignacaoRepo,
      itemRepo,
      criarMockPerfilRepo(),
      criarMockMovRepo(),
      { falhar: true }
    );
    const result = await new RegistrarEntregaConsignacaoUseCase(deps).executar({ consignacaoId: 1 });
    assert.strictEqual(result.isFail(), true);
    assert.strictEqual(deps.publisher.publicados.length, 0);
  });

  console.log(`\nResultado: ${passou} passou, ${falhou} falhou\n`);
  if (falhou > 0) process.exit(1);
}

run();
