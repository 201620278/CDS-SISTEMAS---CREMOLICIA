/**
 * HOTFIX P0 — PATCH semântico em ConsignacaoRepository.atualizar()
 * Executar: npm run test:motor-comercial-consignacao-patch
 */

const assert = require('assert');
const {
  expandConsignacaoEmbeddedForPatch
} = require('../../backend/motores/motor-comercial/utils/comercialMapper');
const {
  derivarCamposCacheConsignacao
} = require('../../backend/motores/motor-comercial/services/projections/ledgerCacheDerivation');
const ConsignacaoRepository = require('../../backend/motores/motor-comercial/repositories/ConsignacaoRepository');
const AbrirPrestacaoUseCase = require('../../backend/motores/motor-comercial/usecases/consignacao/AbrirPrestacaoUseCase');

let passou = 0;
let falhou = 0;

function test(nome, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => { passou += 1; console.log(`  OK  ${nome}`); })
    .catch((err) => { falhou += 1; console.error(`  FALHOU  ${nome}\n         ${err.message}`); });
}

function criarRowBase(overrides = {}) {
  return {
    id: 1,
    cliente_id: 10,
    perfil_comercial_id: 20,
    status: 'ENTREGUE',
    documento_numero: 'DOC-1',
    documento_serie: 'A',
    documento_sequencial: 1,
    documento_data_emissao: '2026-07-01',
    documento_situacao: 'ATIVO',
    prestacao_id: 'prest-1-abc',
    prestacao_numero: 'P-1',
    prestacao_status: 'ABERTA',
    prestacao_data_abertura: '2026-07-01T10:00:00.000Z',
    prestacao_data_fechamento: null,
    valor_total_entregue: 100,
    valor_total_acertado: 0,
    valor_total_pago: 0,
    saldo_aberto: 100,
    observacao: null,
    usuario_abertura_id: 1,
    usuario_encerramento_id: null,
    data_abertura: '2026-07-01',
    data_entrega: '2026-07-01',
    data_encerramento: null,
    documento_externo: null,
    created_at: '2026-07-01T09:00:00.000Z',
    updated_at: '2026-07-01T09:00:00.000Z',
    ...overrides
  };
}

/**
 * Mock mínimo SQLite-like para ConsignacaoRepository (SELECT/UPDATE por id).
 */
function criarDbMemoria(rowInicial) {
  const store = new Map();
  store.set(Number(rowInicial.id), { ...rowInicial });

  return {
    whenReady(cb) { cb(null); },
    get(sql, params, cb) {
      try {
        if (/SELECT \* FROM .+ WHERE id = \?/i.test(sql)) {
          const id = Number(params[0]);
          return cb(null, store.get(id) ? { ...store.get(id) } : null);
        }
        return cb(null, null);
      } catch (err) {
        cb(err);
      }
    },
    all(_sql, _params, cb) { cb(null, []); },
    run(sql, params, cb) {
      try {
        if (/^UPDATE\s+/i.test(sql)) {
          const id = Number(params[params.length - 1]);
          const row = store.get(id);
          if (!row) return cb(new Error(`row ${id} not found`));

          const setMatch = sql.match(/SET\s+(.+)\s+WHERE\s+id\s*=\s*\?/i);
          if (!setMatch) return cb(new Error('UPDATE sem SET'));

          const setClause = setMatch[1];
          const assignments = setClause.split(',').map((s) => s.trim());
          let pi = 0;
          for (const assignment of assignments) {
            if (/updated_at\s*=\s*CURRENT_TIMESTAMP/i.test(assignment)) {
              row.updated_at = new Date().toISOString();
              continue;
            }
            const m = assignment.match(/^(\w+)\s*=\s*\?$/);
            if (!m) return cb(new Error(`assignment inválido: ${assignment}`));
            row[m[1]] = params[pi++];
          }
          store.set(id, row);
          return cb.call({ lastID: id, changes: 1 }, null);
        }
        return cb(new Error(`SQL não suportado no mock: ${sql}`));
      } catch (err) {
        cb(err);
      }
    },
    _store: store
  };
}

async function run() {
  console.log('\n=== HOTFIX P0 — ConsignacaoRepository PATCH ===\n');

  await test('expand — ausência de prestacaoContasAtiva não gera colunas', async () => {
    const { cols, meta } = expandConsignacaoEmbeddedForPatch({ saldoAberto: 50 });
    assert.strictEqual(cols.prestacao_id, undefined);
    assert.strictEqual(cols.prestacao_status, undefined);
    assert.strictEqual(cols.documento_numero, undefined);
    assert.strictEqual(meta.prestacaoAlterada, false);
    assert.strictEqual(meta.documentoAlterado, false);
  });

  await test('expand — null explícito limpa prestação', async () => {
    const { cols, meta } = expandConsignacaoEmbeddedForPatch({ prestacaoContasAtiva: null });
    assert.strictEqual(cols.prestacao_id, null);
    assert.strictEqual(cols.prestacao_status, null);
    assert.strictEqual(meta.prestacaoAlterada, true);
  });

  await test('Cenário 2 — atualizar só saldoAberto preserva prestacao_id', async () => {
    const db = criarDbMemoria(criarRowBase());
    const repo = new ConsignacaoRepository({ db });
    const atualizada = await repo.atualizar(1, { saldoAberto: 80 });
    assert.strictEqual(atualizada.saldoAberto, 80);
    assert.strictEqual(atualizada.prestacaoContasAtiva.id, 'prest-1-abc');
    assert.strictEqual(atualizada.prestacaoContasAtiva.status, 'ABERTA');
  });

  await test('Cenário 3 — atualizar só valorTotalEntregue preserva status ABERTA', async () => {
    const db = criarDbMemoria(criarRowBase());
    const repo = new ConsignacaoRepository({ db });
    const atualizada = await repo.atualizar(1, { valorTotalEntregue: 120 });
    assert.strictEqual(atualizada.valorTotalEntregue, 120);
    assert.strictEqual(atualizada.prestacaoContasAtiva.status, 'ABERTA');
    assert.strictEqual(atualizada.prestacaoContasAtiva.id, 'prest-1-abc');
  });

  await test('Cenário 4 — prestacaoContasAtiva null limpa ponteiro', async () => {
    const db = criarDbMemoria(criarRowBase());
    const repo = new ConsignacaoRepository({ db });
    const atualizada = await repo.atualizar(1, { prestacaoContasAtiva: null });
    assert.strictEqual(atualizada.prestacaoContasAtiva, null);
    const raw = db._store.get(1);
    assert.strictEqual(raw.prestacao_id, null);
    assert.strictEqual(raw.prestacao_status, null);
  });

  await test('Cenário 1 — sync cache pós-venda preserva prestacao_id/ABERTA', async () => {
    const db = criarDbMemoria(criarRowBase({
      valor_total_acertado: 0,
      saldo_aberto: 100
    }));
    const repo = new ConsignacaoRepository({ db });

    const cache = derivarCamposCacheConsignacao([
      {
        tipoMovimentacao: 'ENTREGA',
        valor: 100,
        dataMovimentacao: '2026-07-01T09:00:00.000Z'
      },
      {
        tipoMovimentacao: 'VENDA_PRESTACAO',
        valor: 45,
        grupoPrestacaoContasId: 'prest-1-abc',
        dataMovimentacao: '2026-07-01T11:00:00.000Z'
      }
    ]);

    assert.ok(!Object.prototype.hasOwnProperty.call(cache, 'prestacaoContasAtiva'));

    const atualizada = await repo.atualizar(1, cache);
    assert.strictEqual(atualizada.prestacaoContasAtiva.id, 'prest-1-abc');
    assert.strictEqual(atualizada.prestacaoContasAtiva.status, 'ABERTA');
    assert.strictEqual(Number(atualizada.valorTotalAcertado), 45);
  });

  await test('Cenário 5 — ponteiro nulo + ledger aberto ⇒ Abrir reutiliza (sem novo grupo)', async () => {
    const grupoId = 'prest-1-abc';
    let cons = {
      id: 1,
      status: 'ENTREGUE',
      documento: { numero: 'DOC-1' },
      prestacaoContasAtiva: null
    };
    const movs = [
      {
        tipoMovimentacao: 'ABERTURA_PRESTACAO',
        grupoPrestacaoContasId: grupoId,
        dataMovimentacao: '2026-07-01T10:00:00.000Z',
        snapshot: { grupoPrestacaoContas: { documento: { numero: 'P-1' } } }
      },
      {
        tipoMovimentacao: 'VENDA_PRESTACAO',
        grupoPrestacaoContasId: grupoId,
        valor: 45,
        dataMovimentacao: '2026-07-01T11:00:00.000Z'
      }
    ];

    const consignacaoRepo = {
      buscarPorId: async () => ({ ...cons }),
      atualizar: async (_id, dados) => {
        if (Object.prototype.hasOwnProperty.call(dados, 'prestacaoContasAtiva')) {
          cons = { ...cons, prestacaoContasAtiva: dados.prestacaoContasAtiva };
        }
        return { ...cons };
      }
    };
    const movRepo = {
      listar: async () => [...movs],
      inserir: async (dados) => {
        const mov = { id: movs.length + 1, ...dados };
        movs.push(mov);
        return mov;
      }
    };

    const uow = {
      consignacao: consignacaoRepo,
      consignacaoItem: { listarPorConsignacao: async () => [] },
      movimentacaoComercial: movRepo,
      executar: async (fn) => fn(uow)
    };

    const result = await new AbrirPrestacaoUseCase({
      unitOfWork: uow,
      eventPublisher: { publicar: () => {}, flush: async () => {} }
    }).executar({ consignacaoId: 1, correlationId: 'corr-rec' });

    assert.strictEqual(result.isOk(), true, result.erro?.message);
    assert.strictEqual(result.dados.grupoPrestacaoContas.id, grupoId);
    assert.strictEqual(result.dados.recuperadoDoLedger, true);
    assert.strictEqual(movs.filter((m) => m.tipoMovimentacao === 'ABERTURA_PRESTACAO').length, 1);
    assert.strictEqual(cons.prestacaoContasAtiva.id, grupoId);
  });

  await test('documento ausente não entra no UPDATE', async () => {
    const db = criarDbMemoria(criarRowBase({ documento_numero: 'DOC-KEEP' }));
    const repo = new ConsignacaoRepository({ db });
    await repo.atualizar(1, { observacao: 'x' });
    assert.strictEqual(db._store.get(1).documento_numero, 'DOC-KEEP');
    assert.strictEqual(db._store.get(1).observacao, 'x');
  });

  console.log(`\nResultado: ${passou} ok, ${falhou} falha(s)\n`);
  if (falhou > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
