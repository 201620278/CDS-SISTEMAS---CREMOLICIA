/**
 * Testes — Ledger → Projection → Cache (Sprint P-1)
 * Executar: npm run test:motor-comercial-ledger-cache
 */

const assert = require('assert');
const {
  derivarSaldoAbertoPerfil,
  derivarCamposCacheConsignacao
} = require('../../backend/motores/motor-comercial/services/projections/ledgerCacheDerivation');

let passou = 0;
let falhou = 0;

function test(nome, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => { passou += 1; console.log(`  OK  ${nome}`); })
    .catch((err) => { falhou += 1; console.error(`  FALHOU  ${nome}\n         ${err.message}`); });
}

function mov(tipo, valor, extras = {}) {
  return {
    id: extras.id ?? Math.random(),
    consignacaoId: 1,
    tipoMovimentacao: tipo,
    valor,
    dataMovimentacao: extras.data ?? '2026-06-01T10:00:00.000Z',
    grupoPrestacaoContasId: extras.grupo ?? null,
    ...extras
  };
}

async function run() {
  console.log('\n=== Testes Ledger Cache Derivation — Sprint P-1 ===\n');

  await test('Perfil — Entrega consome limite', async () => {
    const saldo = derivarSaldoAbertoPerfil([mov('ENTREGA', 100)]);
    assert.strictEqual(saldo, 100);
  });

  await test('Perfil — Devolução reduz estoque consignado', async () => {
    const saldo = derivarSaldoAbertoPerfil([
      mov('ENTREGA', 100, { id: 1, data: '2026-06-01T09:00:00.000Z' }),
      mov('DEVOLUCAO', 30, { id: 2, data: '2026-06-01T10:00:00.000Z' })
    ]);
    assert.strictEqual(saldo, 70);
  });

  await test('Perfil — Venda converte estoque em AR (não libera crédito)', async () => {
    const saldo = derivarSaldoAbertoPerfil([
      mov('ENTREGA', 100, { id: 1, data: '2026-06-01T09:00:00.000Z' }),
      mov('VENDA_PRESTACAO', 30, { id: 2, grupo: 'g1', data: '2026-06-02T10:00:00.000Z' })
    ]);
    // estoque 70 + AR 30 = 100
    assert.strictEqual(saldo, 100);
  });

  await test('Perfil — Pagamento reduz AR / libera crédito', async () => {
    const saldo = derivarSaldoAbertoPerfil([
      mov('ENTREGA', 100, { id: 1, data: '2026-06-01T09:00:00.000Z' }),
      mov('VENDA_PRESTACAO', 50, { id: 2, grupo: 'g1', data: '2026-06-02T10:00:00.000Z' }),
      mov('PAGAMENTO', 50, { id: 3, grupo: 'g1', data: '2026-06-03T10:00:00.000Z' })
    ]);
    // estoque restante 50 + AR 0 = 50
    assert.strictEqual(saldo, 50);
  });

  await test('Perfil — Exemplo oficial: parcial deixa saldo devedor', async () => {
    const saldo = derivarSaldoAbertoPerfil([
      mov('ENTREGA', 50, { id: 1, data: '2026-06-01T09:00:00.000Z' }),
      mov('DEVOLUCAO', 5, { id: 2, data: '2026-06-02T09:00:00.000Z' }),
      mov('VENDA_PRESTACAO', 45, { id: 3, grupo: 'g1', data: '2026-06-02T10:00:00.000Z' }),
      mov('PAGAMENTO', 40, { id: 4, grupo: 'g1', data: '2026-06-03T10:00:00.000Z' })
    ]);
    assert.strictEqual(saldo, 5);
  });

  await test('Consignação — Entrega define saldo e valor entregue', async () => {
    const cache = derivarCamposCacheConsignacao([mov('ENTREGA', 100)]);
    assert.strictEqual(cache.valorTotalEntregue, 100);
    assert.strictEqual(cache.saldoAberto, 100);
  });

  await test('Consignação — Devolução reduz saldo', async () => {
    const cache = derivarCamposCacheConsignacao([
      mov('ENTREGA', 100, { id: 1, data: '2026-06-01T09:00:00.000Z' }),
      mov('DEVOLUCAO', 25, { id: 2, data: '2026-06-01T11:00:00.000Z' })
    ]);
    assert.strictEqual(cache.saldoAberto, 75);
  });

  await test('Consignação — Venda incrementa acertado e saldo', async () => {
    const cache = derivarCamposCacheConsignacao([
      mov('ENTREGA', 100, { id: 1, data: '2026-06-01T09:00:00.000Z' }),
      mov('VENDA_PRESTACAO', 40, { id: 2, grupo: 'g1', data: '2026-06-02T10:00:00.000Z' })
    ]);
    assert.strictEqual(cache.valorTotalAcertado, 40);
    assert.strictEqual(cache.saldoAberto, 140);
  });

  await test('Consignação — Pagamento reduz saldo', async () => {
    const cache = derivarCamposCacheConsignacao([
      mov('ENTREGA', 100, { id: 1, data: '2026-06-01T09:00:00.000Z' }),
      mov('VENDA_PRESTACAO', 40, { id: 2, grupo: 'g1', data: '2026-06-02T10:00:00.000Z' }),
      mov('PAGAMENTO', 40, { id: 3, grupo: 'g1', data: '2026-06-03T10:00:00.000Z' })
    ]);
    assert.strictEqual(cache.valorTotalPago, 40);
    assert.strictEqual(cache.saldoAberto, 100);
  });

  await test('Consignação — Fechamento substitui saldo pela prestação', async () => {
    const movimentacoes = [
      mov('ENTREGA', 100, { id: 1, data: '2026-06-01T09:00:00.000Z' }),
      mov('ABERTURA_PRESTACAO', null, { id: 2, grupo: 'g1', data: '2026-06-02T09:00:00.000Z' }),
      mov('VENDA_PRESTACAO', 40, { id: 3, grupo: 'g1', data: '2026-06-02T10:00:00.000Z' }),
      mov('PAGAMENTO', 10, { id: 4, grupo: 'g1', data: '2026-06-03T10:00:00.000Z' }),
      mov('FECHAMENTO_PRESTACAO', 30, { id: 5, grupo: 'g1', data: '2026-06-04T10:00:00.000Z' })
    ];
    const cache = derivarCamposCacheConsignacao(movimentacoes);
    assert.strictEqual(cache.valorTotalAcertado, 40);
    assert.strictEqual(cache.saldoAberto, 30);
  });

  await test('Fluxo completo — movimentação → projeção → mesmo saldo perfil', async () => {
    const movimentacoes = [
      mov('ENTREGA', 200, { id: 1, data: '2026-06-01T09:00:00.000Z' }),
      mov('DEVOLUCAO', 20, { id: 2, data: '2026-06-01T10:00:00.000Z' }),
      mov('VENDA_PRESTACAO', 60, { id: 3, grupo: 'g1', data: '2026-06-02T10:00:00.000Z' }),
      mov('PAGAMENTO', 60, { id: 4, grupo: 'g1', data: '2026-06-03T10:00:00.000Z' })
    ];
    const saldoPerfil = derivarSaldoAbertoPerfil(movimentacoes);
    const cacheConsignacao = derivarCamposCacheConsignacao(movimentacoes);
    // estoque 120 + AR 0
    assert.strictEqual(saldoPerfil, 120);
    assert.strictEqual(cacheConsignacao.saldoAberto, 180);
  });

  console.log(`\nResultado: ${passou} passou, ${falhou} falhou\n`);
  if (falhou > 0) process.exit(1);
}

run();
