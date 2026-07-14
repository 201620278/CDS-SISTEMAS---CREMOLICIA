/**
 * Testes — Use Cases PerfilComercial (Sprint 2.3)
 * Executar: npm run test:motor-comercial-perfil
 */

const assert = require('assert');
const {
  CriarPerfilComercialUseCase,
  AtivarPerfilComercialUseCase,
  InativarPerfilComercialUseCase,
  AlterarLimiteComercialUseCase,
  BloquearPerfilComercialUseCase,
  DesbloquearPerfilComercialUseCase,
  RegistrarLiberacaoGerencialUseCase,
  ConsultarPerfilComercialUseCase,
  ConsultarHistoricoPerfilUseCase,
  ConsultarLimiteDisponivelUseCase,
  ConsultarScoreConfiabilidadeUseCase,
  AtualizarPerfilComercialUseCase
} = require('../../backend/motores/motor-comercial/usecases/perfil');
const { EVENTOS_DOMINIO } = require('../../backend/motores/motor-comercial/events/comercialEventosTipos');

let passou = 0;
let falhou = 0;

function test(nome, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      passou += 1;
      console.log(`  OK  ${nome}`);
    })
    .catch((error) => {
      falhou += 1;
      console.error(`  FALHOU  ${nome}`);
      console.error(`         ${error.message}`);
    });
}

function criarPerfil(overrides = {}) {
  return {
    id: 1,
    clienteId: 10,
    perfilTipo: 'CONSIGNADO',
    ativo: true,
    limiteComercial: 1000,
    saldoAberto: 200,
    bloqueado: false,
    motivoBloqueio: null,
    scoreConfiabilidade: 85,
    scoreCalculadoEm: '2026-01-01T00:00:00.000Z',
    dataAtivacao: '2026-01-01T00:00:00.000Z',
    dataInativacao: null,
    observacoes: null,
    ...overrides
  };
}

function criarMockPerfilRepo(estadoInicial = null) {
  let store = estadoInicial ? { ...estadoInicial } : null;
  const todos = estadoInicial ? [{ ...estadoInicial }] : [];

  return {
    buscarPorId: async (id) => {
      if (!store || store.id !== id) return null;
      return { ...store };
    },
    listar: async (filtros = {}) => {
      return todos.filter((p) => {
        if (filtros.clienteId != null && p.clienteId !== filtros.clienteId) return false;
        if (filtros.perfilTipo && p.perfilTipo !== filtros.perfilTipo) return false;
        if (filtros.ativo != null && p.ativo !== filtros.ativo) return false;
        return true;
      });
    },
    inserir: async (dados) => {
      store = {
        id: store?.id ?? todos.length + 1,
        saldoAberto: 0,
        bloqueado: false,
        ...dados
      };
      todos.push({ ...store });
      return { ...store };
    },
    atualizar: async (id, dados) => {
      if (!store || store.id !== id) return null;
      store = { ...store, ...dados };
      const idx = todos.findIndex((p) => p.id === id);
      if (idx >= 0) todos[idx] = { ...store };
      return { ...store };
    }
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
      if (filtros.perfilComercialId != null && m.perfilComercialId !== filtros.perfilComercialId) {
        return false;
      }
      if (filtros.tipoMovimentacao && m.tipoMovimentacao !== filtros.tipoMovimentacao) {
        return false;
      }
      return true;
    }),
    movimentacoes
  };
}

function criarMockMovComercialRepo(movimentacoesIniciais = []) {
  const movimentacoes = [...movimentacoesIniciais];
  return {
    inserir: async (dados) => {
      const mov = { id: movimentacoes.length + 1, ...dados };
      movimentacoes.push(mov);
      return mov;
    },
    listar: async (filtros = {}) => movimentacoes.filter((m) => {
      if (filtros.consignacaoId != null && m.consignacaoId !== filtros.consignacaoId) return false;
      if (filtros.grupoPrestacaoContasId && m.grupoPrestacaoContasId !== filtros.grupoPrestacaoContasId) return false;
      if (filtros.tipoMovimentacao && m.tipoMovimentacao !== filtros.tipoMovimentacao) return false;
      return true;
    }),
    movimentacoes
  };
}

function criarMockConsignacaoRepoLedger(perfilComercialId = 1) {
  return {
    listar: async (filtros = {}) => {
      if (filtros.perfilComercialId != null && filtros.perfilComercialId !== perfilComercialId) {
        return [];
      }
      return [{ id: 1, perfilComercialId }];
    }
  };
}

function criarMockUow(perfilRepo, movRepo, opcoes = {}) {
  const movComercialRepo = opcoes.movComercialRepo ?? criarMockMovComercialRepo();
  const consignacaoRepo = opcoes.consignacaoRepo ?? criarMockConsignacaoRepoLedger(1);
  const uow = {
    perfilComercial: perfilRepo,
    movimentacaoPerfil: movRepo,
    consignacao: consignacaoRepo,
    movimentacaoComercial: movComercialRepo,
    executar: async (fn) => {
      if (opcoes.falhar) {
        opcoes.falhar = false;
        throw new Error('erro simulado para rollback');
      }
      return fn(uow);
    }
  };
  return uow;
}

function criarMockPublisher() {
  const publicados = [];
  return {
    publicar: (evento) => publicados.push(evento),
    flush: async () => {},
    publicados
  };
}

function criarMockClienteBridge(cliente = { id: 10, nome: 'Cliente Teste' }, ativo = true) {
  return {
    buscarPorId: async (id) => (id === cliente.id ? cliente : null),
    estaAtivo: async () => ativo
  };
}

function criarMockUsuarioBridge(permitido = true) {
  return {
    possuiPermissao: async () => permitido
  };
}

function criarDepsWrite(perfilRepo, movRepo, opcoes = {}) {
  return {
    unitOfWork: criarMockUow(perfilRepo, movRepo, opcoes),
    eventPublisher: criarMockPublisher(),
    clienteBridge: opcoes.clienteBridge ?? criarMockClienteBridge(),
    usuarioBridge: opcoes.usuarioBridge ?? criarMockUsuarioBridge(true)
  };
}

function criarDepsRead(perfilRepo, movRepo, opcoes = {}) {
  const movComercialRepo = opcoes.movComercialRepo ?? criarMockMovComercialRepo();
  const consignacaoRepo = opcoes.consignacaoRepo ?? criarMockConsignacaoRepoLedger(1);
  return {
    perfilComercialRepository: perfilRepo,
    movimentacaoPerfilRepository: movRepo,
    movimentacaoComercialRepository: movComercialRepo,
    consignacaoRepository: consignacaoRepo
  };
}

async function run() {
  console.log('\n=== Testes Use Cases PerfilComercial — Sprint 2.3 ===\n');

  await test('UC-001 CriarPerfilComercial — fluxo feliz', async () => {
    const perfilRepo = criarMockPerfilRepo();
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo);
    const uc = new CriarPerfilComercialUseCase(deps);

    const result = await uc.executar({
      clienteId: 10,
      perfilTipo: 'CONSIGNADO',
      limiteComercial: 5000,
      usuarioId: 1
    });

    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.perfil.clienteId, 10);
    assert.strictEqual(movRepo.movimentacoes.length, 1);
    assert.strictEqual(movRepo.movimentacoes[0].tipoMovimentacao, 'PERFIL_CRIADO');
    assert.strictEqual(deps.eventPublisher.publicados.length, 1);
    assert.strictEqual(deps.eventPublisher.publicados[0].tipo, EVENTOS_DOMINIO.PERFIL_COMERCIAL_CRIADO);
  });

  await test('UC-001 CriarPerfilComercial — cliente não encontrado', async () => {
    const deps = criarDepsWrite(criarMockPerfilRepo(), criarMockMovRepo(), {
      clienteBridge: {
        buscarPorId: async () => null,
        estaAtivo: async () => false
      }
    });
    const result = await new CriarPerfilComercialUseCase(deps).executar({
      clienteId: 99,
      perfilTipo: 'CONSIGNADO'
    });
    assert.strictEqual(result.isFail(), true);
    assert.strictEqual(result.erro.codigo, 'CLIENTE_NAO_ENCONTRADO');
  });

  await test('UC-001 CriarPerfilComercial — perfil duplicado', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil());
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo);
    const result = await new CriarPerfilComercialUseCase(deps).executar({
      clienteId: 10,
      perfilTipo: 'CONSIGNADO'
    });
    assert.strictEqual(result.isFail(), true);
    assert.strictEqual(result.erro.codigo, 'PERFIL_DUPLICADO');
  });

  await test('UC-002 AtivarPerfilComercial — fluxo feliz', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ ativo: false }));
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo);
    const result = await new AtivarPerfilComercialUseCase(deps).executar({ perfilComercialId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.perfil.ativo, true);
    assert.strictEqual(movRepo.movimentacoes[0].tipoMovimentacao, 'PERFIL_ATIVADO');
  });

  await test('UC-002 AtivarPerfilComercial — perfil não encontrado', async () => {
    const deps = criarDepsWrite(criarMockPerfilRepo(), criarMockMovRepo());
    const result = await new AtivarPerfilComercialUseCase(deps).executar({ perfilComercialId: 99 });
    assert.strictEqual(result.isFail(), true);
    assert.strictEqual(result.erro.codigo, 'PERFIL_NAO_ENCONTRADO');
  });

  await test('UC-003 InativarPerfilComercial — fluxo feliz', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ ativo: true }));
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo);
    const result = await new InativarPerfilComercialUseCase(deps).executar({ perfilComercialId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.perfil.ativo, false);
    assert.strictEqual(movRepo.movimentacoes[0].tipoMovimentacao, 'PERFIL_INATIVADO');
  });

  await test('UC-004 AlterarLimiteComercial — fluxo feliz com snapshot', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ limiteComercial: 1000, saldoAberto: 200 }));
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo);
    const result = await new AlterarLimiteComercialUseCase(deps).executar({
      perfilComercialId: 1,
      novoLimite: 3000,
      usuarioId: 1
    });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.limiteNovo, 3000);
    assert.ok(movRepo.movimentacoes[0].snapshot);
    assert.strictEqual(movRepo.movimentacoes[0].tipoMovimentacao, 'LIMITE_ALTERADO');
  });

  await test('UC-004 AlterarLimiteComercial — limite insuficiente', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ saldoAberto: 500 }));
    const movComercialRepo = criarMockMovComercialRepo([
      {
        id: 1,
        consignacaoId: 1,
        tipoMovimentacao: 'ENTREGA',
        valor: 500,
        dataMovimentacao: '2026-06-01T09:00:00.000Z'
      }
    ]);
    const deps = criarDepsWrite(perfilRepo, criarMockMovRepo(), { movComercialRepo });
    const result = await new AlterarLimiteComercialUseCase(deps).executar({
      perfilComercialId: 1,
      novoLimite: 100,
      usuarioId: 1
    });
    assert.strictEqual(result.isFail(), true);
    assert.strictEqual(result.erro.codigo, 'LIMITE_COMERCIAL_INSUFICIENTE');
  });

  await test('UC-004 AlterarLimiteComercial — sem permissão COMERCIAL_LIMITE', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ limiteComercial: 1000, saldoAberto: 200 }));
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo, {
      usuarioBridge: criarMockUsuarioBridge(false)
    });
    const result = await new AlterarLimiteComercialUseCase(deps).executar({
      perfilComercialId: 1,
      novoLimite: 3000,
      usuarioId: 2
    });
    assert.strictEqual(result.isFail(), true);
    assert.strictEqual(result.erro.codigo, 'OPERACAO_NAO_AUTORIZADA');
  });

  await test('UC-005 BloquearPerfilComercial — fluxo feliz', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ bloqueado: false }));
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo);
    const result = await new BloquearPerfilComercialUseCase(deps).executar({
      perfilComercialId: 1,
      motivo: 'Inadimplência'
    });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.perfil.bloqueado, true);
    assert.strictEqual(movRepo.movimentacoes[0].tipoMovimentacao, 'BLOQUEIO_APLICADO');
    assert.strictEqual(deps.eventPublisher.publicados[0].tipo, EVENTOS_DOMINIO.PERFIL_BLOQUEADO);
  });

  await test('UC-006 DesbloquearPerfilComercial — fluxo feliz', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ bloqueado: true, motivoBloqueio: 'Teste' }));
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo);
    const result = await new DesbloquearPerfilComercialUseCase(deps).executar({ perfilComercialId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.perfil.bloqueado, false);
    assert.strictEqual(movRepo.movimentacoes[0].tipoMovimentacao, 'BLOQUEIO_REMOVIDO');
  });

  await test('UC-007 RegistrarLiberacaoGerencial — fluxo feliz', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil());
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo);
    const result = await new RegistrarLiberacaoGerencialUseCase(deps).executar({
      perfilComercialId: 1,
      motivo: 'Autorização excepcional',
      usuarioId: 5,
      valor: 500,
      correlationId: 'corr-test-001'
    });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(movRepo.movimentacoes[0].tipoMovimentacao, 'LIBERACAO_GERENCIAL');
    assert.strictEqual(movRepo.movimentacoes[0].correlationId, 'corr-test-001');
    assert.ok(movRepo.movimentacoes[0].snapshot);
  });

  await test('UC-008 ConsultarPerfilComercial — por id', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil());
    const deps = criarDepsRead(perfilRepo, criarMockMovRepo());
    const result = await new ConsultarPerfilComercialUseCase(deps).executar({ perfilComercialId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.id, 1);
  });

  await test('UC-008 ConsultarPerfilComercial — não encontrado', async () => {
    const deps = criarDepsRead(criarMockPerfilRepo(), criarMockMovRepo());
    const result = await new ConsultarPerfilComercialUseCase(deps).executar({ perfilComercialId: 99 });
    assert.strictEqual(result.isFail(), true);
    assert.strictEqual(result.erro.codigo, 'PERFIL_NAO_ENCONTRADO');
  });

  await test('UC-009 ConsultarHistoricoPerfil — ledger exclusivo', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil());
    const movRepo = criarMockMovRepo();
    movRepo.movimentacoes.push({
      id: 1,
      perfilComercialId: 1,
      tipoMovimentacao: 'PERFIL_ATIVADO',
      dataMovimentacao: '2026-01-02'
    });
    const deps = criarDepsRead(perfilRepo, movRepo);
    const result = await new ConsultarHistoricoPerfilUseCase(deps).executar({ perfilComercialId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.movimentacoes.length, 1);
  });

  await test('UC-010 ConsultarLimiteDisponivel — cálculo via ledger', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ limiteComercial: 1000, saldoAberto: 200 }));
    const movRepo = criarMockMovRepo();
    movRepo.movimentacoes.push({
      id: 1,
      perfilComercialId: 1,
      tipoMovimentacao: 'LIMITE_ALTERADO',
      dataMovimentacao: '2026-01-02',
      snapshot: { limiteComercial: 2000, saldoAberto: 300 }
    });
    const movComercialRepo = criarMockMovComercialRepo([
      {
        id: 1,
        consignacaoId: 1,
        tipoMovimentacao: 'ENTREGA',
        valor: 300,
        dataMovimentacao: '2026-06-01T09:00:00.000Z'
      }
    ]);
    const deps = criarDepsRead(perfilRepo, movRepo, { movComercialRepo });
    const result = await new ConsultarLimiteDisponivelUseCase(deps).executar({ perfilComercialId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.limiteComercial, 2000);
    assert.strictEqual(result.dados.saldoAberto, 300);
    assert.strictEqual(result.dados.limiteDisponivel, 1700);
  });

  await test('UC-011 ConsultarScoreConfiabilidade — cache do perfil', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ scoreConfiabilidade: 92 }));
    const deps = criarDepsRead(perfilRepo, criarMockMovRepo());
    const result = await new ConsultarScoreConfiabilidadeUseCase(deps).executar({ perfilComercialId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.score, 92);
    assert.strictEqual(result.dados.fonte, 'cache');
  });

  await test('UC-011 ConsultarScoreConfiabilidade — ScoreService quando existir', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil());
    const deps = {
      ...criarDepsRead(perfilRepo, criarMockMovRepo()),
      scoreService: {
        obterScore: async () => ({ score: 99, calculadoEm: '2026-06-01' })
      }
    };
    const result = await new ConsultarScoreConfiabilidadeUseCase(deps).executar({ perfilComercialId: 1 });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.score, 99);
    assert.strictEqual(result.dados.fonte, 'ScoreService');
  });

  await test('UC-004 AtualizarPerfilComercial — persiste observações', async () => {
    const perfilRepo = criarMockPerfilRepo(criarPerfil({ observacoes: 'Antes' }));
    const movRepo = criarMockMovRepo();
    const ativar = new AtivarPerfilComercialUseCase(criarDepsWrite(perfilRepo, movRepo));
    const inativar = new InativarPerfilComercialUseCase(criarDepsWrite(perfilRepo, movRepo));
    const deps = {
      ...criarDepsWrite(perfilRepo, movRepo),
      ativarPerfilComercialUseCase: ativar,
      inativarPerfilComercialUseCase: inativar
    };
    const result = await new AtualizarPerfilComercialUseCase(deps).executar({
      perfilComercialId: 1,
      observacoes: 'Depois'
    });
    assert.strictEqual(result.isOk(), true);
    assert.strictEqual(result.dados.perfil.observacoes, 'Depois');
  });

  await test('Escrita com erro — não publica eventos após rollback', async () => {
    const perfilRepo = criarMockPerfilRepo();
    const movRepo = criarMockMovRepo();
    const deps = criarDepsWrite(perfilRepo, movRepo, { falhar: true });
    const uc = new CriarPerfilComercialUseCase(deps);

    const originalExecutar = deps.unitOfWork.executar.bind(deps.unitOfWork);
    deps.unitOfWork.executar = async (fn) => {
      try {
        await originalExecutar(fn);
      } catch {
        throw new Error('rollback');
      }
    };

    movRepo.inserir = async () => {
      throw new Error('falha na persistência');
    };

    const result = await uc.executar({ clienteId: 10, perfilTipo: 'CONSIGNADO' });
    assert.strictEqual(result.isFail(), true);
    assert.strictEqual(deps.eventPublisher.publicados.length, 0);
  });

  console.log(`\nResultado: ${passou} passou, ${falhou} falhou\n`);
  if (falhou > 0) process.exit(1);
}

run();
