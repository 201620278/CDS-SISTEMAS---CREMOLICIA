/**
 * Saldo não fiscal — órfãos de venda_id reutilizado não podem abater o pendente.
 */
const assert = require('assert');
const {
  calcularSaldoNaoFiscal,
  filtrarRecebimentosDaVendaCorrente
} = require('../../backend/services/vendas/VendaPagamentoService');

const venda = {
  codigo: 'VND-20260714011420',
  data_venda: '2026-07-14',
  valor_nao_fiscal: 10,
  valor_fiscal: 10
};

const recebimentos = [
  {
    tipo_recebimento: 'nao_fiscal',
    valor: 8,
    created_at: '2026-07-06 04:11:07'
  },
  {
    tipo_recebimento: 'nao_fiscal',
    valor: 2,
    created_at: '2026-07-14 04:14:54'
  }
];

const filtrados = filtrarRecebimentosDaVendaCorrente(venda, recebimentos);
assert.strictEqual(filtrados.length, 1);
assert.strictEqual(Number(filtrados[0].valor), 2);

const saldo = calcularSaldoNaoFiscal(venda, recebimentos);
assert.strictEqual(saldo.valorNaoFiscal, 10);
assert.strictEqual(saldo.valorRecebido, 2);
assert.strictEqual(saldo.saldoPendente, 8);

const saldoLimpo = calcularSaldoNaoFiscal(venda, []);
assert.strictEqual(saldoLimpo.saldoPendente, 10);

console.log('✓ saldo nao fiscal ignora recebimentos orfaos');
