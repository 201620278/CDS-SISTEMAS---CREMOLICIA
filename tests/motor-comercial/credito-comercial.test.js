/**
 * Testes unitários — CreditoComercialService (regra oficial CDS)
 */

const assert = require('assert');
const CreditoComercialService = require('../../backend/motores/motor-comercial/services/CreditoComercialService');

let passou = 0;
let falhou = 0;

function test(nome, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => { passou += 1; console.log(`  OK  ${nome}`); })
    .catch((err) => { falhou += 1; console.error(`  FALHOU  ${nome}\n         ${err.message}`); });
}

function mov(tipo, valor) {
  return { tipoMovimentacao: tipo, valor, dataMovimentacao: '2026-06-01T10:00:00.000Z', id: Math.random() };
}

async function run() {
  console.log('\n=== CreditoComercialService — P0 ===\n');

  await test('exemplo oficial: parcial → saldo 5 e disponível 45', async () => {
    const m = CreditoComercialService.calcular({
      limiteComercial: 50,
      movimentacoes: [
        mov('ENTREGA', 50),
        mov('DEVOLUCAO', 5),
        mov('VENDA_PRESTACAO', 45),
        mov('PAGAMENTO', 40)
      ]
    });
    assert.strictEqual(m.saldoDevedor, 5);
    assert.strictEqual(m.saldoCredor, 0);
    assert.strictEqual(m.creditoDisponivel, 45);
    assert.strictEqual(m.limiteComercial, 50);
  });

  await test('pagamento maior → saldo credor e disponível = limite', async () => {
    const m = CreditoComercialService.calcular({
      limiteComercial: 50,
      movimentacoes: [
        mov('ENTREGA', 50),
        mov('VENDA_PRESTACAO', 45),
        mov('DEVOLUCAO', 5),
        mov('PAGAMENTO', 50)
      ]
    });
    assert.strictEqual(m.saldoDevedor, 0);
    assert.strictEqual(m.saldoCredor, 5);
    assert.strictEqual(m.creditoDisponivel, 50);
  });

  await test('podeEntregar respeita crédito disponível', async () => {
    assert.strictEqual(CreditoComercialService.podeEntregar(45, 45), true);
    assert.strictEqual(CreditoComercialService.podeEntregar(45, 46), false);
  });

  console.log(`\nResultado: ${passou} passou, ${falhou} falhou\n`);
  if (falhou > 0) process.exit(1);
}

run();
