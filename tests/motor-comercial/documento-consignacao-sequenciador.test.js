/**
 * Testes — DocumentoConsignacaoSequenciador (Sprint S-6)
 * Executar: node tests/motor-comercial/documento-consignacao-sequenciador.test.js
 */

const assert = require('assert');
const {
  obterSerieAnual,
  formatarNumeroOficial,
  preverProximoDocumentoConsignacao
} = require('../../backend/motores/motor-comercial/services/DocumentoConsignacaoSequenciador');

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

async function run() {
  console.log('\nDocumentoConsignacaoSequenciador — Sprint S-6\n');

  await test('obterSerieAnual retorna CONS-AAAA', () => {
    assert.strictEqual(obterSerieAnual(2026), 'CONS-2026');
  });

  await test('formatarNumeroOficial CONS-AAAA-000001', () => {
    assert.strictEqual(formatarNumeroOficial('CONS-2026', 1), 'CONS-2026-000001');
    assert.strictEqual(formatarNumeroOficial('CONS-2026', 42), 'CONS-2026-000042');
  });

  await test('preverProximoDocumentoConsignacao incrementa sequencial', async () => {
    const repo = {
      obterMaxSequencialDocumento: async () => 5
    };
    const prev = await preverProximoDocumentoConsignacao(repo, 2026);
    assert.strictEqual(prev.numero, 'CONS-2026-000006');
    assert.strictEqual(prev.sequencial, 6);
    assert.strictEqual(prev.serie, 'CONS-2026');
  });

  console.log(`\nResultado: ${passou} OK, ${falhou} falhou\n`);
  if (falhou > 0) process.exit(1);
}

run();
