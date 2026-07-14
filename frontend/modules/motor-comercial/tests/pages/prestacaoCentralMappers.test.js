/**
 * prestacaoCentralMappers — testes Sprint S-6
 */

const {
  buildResumoFinanceiroCentral,
  buildAuditoriaPrestacao
} = require('../../pages/PrestacaoContas/prestacaoCentralMappers');

describe('prestacaoCentralMappers', () => {
  test('buildResumoFinanceiroCentral', () => {
    const fin = buildResumoFinanceiroCentral({
      valorConsignado: 1000,
      valorVendido: 400,
      valorDevolvido: 100,
      valorPerdido: 50,
      valorCortesia: 25,
      valorRecebido: 300,
      saldoAtual: 525
    }, { saldoAtual: 1200 });
    expect(fin.valorEntregue).toBe(1000);
    expect(fin.saldoCliente).toBe(1200);
    expect(fin.saldoAposPrestacao).toBe(525);
  });

  test('buildResumoFinanceiroCentral tolera contaCorrente nula', () => {
    const fin = buildResumoFinanceiroCentral({ saldoAtual: 100 }, null);
    expect(fin.saldoCliente).toBe(0);
    expect(fin.saldoAposPrestacao).toBe(100);
  });

  test('buildAuditoriaPrestacao', () => {
    const rows = buildAuditoriaPrestacao([
      { dataMovimentacao: '2026-01-01', usuarioId: 1, tipoMovimentacao: 'VENDA', valor: 10 }
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].tipo).toBe('VENDA');
  });
});
