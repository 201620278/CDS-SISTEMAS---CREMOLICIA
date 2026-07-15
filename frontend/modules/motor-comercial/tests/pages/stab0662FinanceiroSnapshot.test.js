/**
 * STAB-06.6.2 — SSOT financeiro da Prestação
 */

const {
  buildFinanceiroFromResumo,
  buildPrestacaoSnapshot,
  auditarIntegridadeFinanceira,
  assertMesmoFinanceiro,
  labelSituacaoFinanceira,
  SITUACAO
} = require('../../pages/PrestacaoContas/prestacaoFinanceiroSnapshot');
const {
  buildPainelLateral,
  buildResumoFinalOficial,
  buildCentralEncerramento
} = require('../../pages/PrestacaoContas/fecharConsignacaoMappers');

describe('STAB-06.6.2 snapshot.financeiro', () => {
  test('prestação quitada', () => {
    const fin = buildFinanceiroFromResumo({
      totalVendido: 30,
      totalPago: 30
    });
    expect(fin.valorVenda).toBe(30);
    expect(fin.valorRecebido).toBe(30);
    expect(fin.saldoEmAberto).toBe(0);
    expect(fin.situacaoFinanceira).toBe(SITUACAO.QUITADA);
    expect(labelSituacaoFinanceira(fin.situacaoFinanceira)).toBe('Quitada');
  });

  test('prestação parcial', () => {
    const fin = buildFinanceiroFromResumo({
      valorVendido: 100,
      valorRecebido: 40
    });
    expect(fin.valorVenda).toBe(100);
    expect(fin.valorRecebido).toBe(40);
    expect(fin.saldoEmAberto).toBe(60);
    expect(fin.situacaoFinanceira).toBe(SITUACAO.PARCIALMENTE_RECEBIDA);
    expect(labelSituacaoFinanceira(fin.situacaoFinanceira)).toBe('Parcial');
  });

  test('integridade valorVenda = valorRecebido + saldoEmAberto', () => {
    const fin = buildFinanceiroFromResumo({ valorVendido: 90, valorRecebido: 25 });
    expect(fin.valorVenda).toBe(fin.valorRecebido + fin.saldoEmAberto);
    expect(auditarIntegridadeFinanceira(fin)).toBeNull();
  });

  test('auditoria registra valores inconsistentes sem bloquear', () => {
    const registro = auditarIntegridadeFinanceira(
      { valorVenda: 100, valorRecebido: 10, saldoEmAberto: 50 },
      { documento: 'CONS-1', cliente: 'Loja', origem: 'teste' }
    );
    expect(registro).toBeTruthy();
    expect(registro.mensagem).toMatch(/Inconsistência financeira/);
    expect(registro.valores.soma).toBe(60);
  });

  test('resumo final espelha o snapshot (sem recalcular)', () => {
    const snapshot = buildPrestacaoSnapshot({ valorVendido: 80, valorRecebido: 20 });
    const oficial = buildResumoFinalOficial({
      financeiro: snapshot.financeiro,
      faturamento: { situacaoFiscal: 'PENDENTE' }
    });
    expect(assertMesmoFinanceiro(snapshot.financeiro, oficial)).toBe(true);
    expect(oficial.valorVenda).toBe(80);
    expect(oficial.valorRecebido).toBe(20);
    expect(oficial.saldoEmAberto).toBe(60);
  });

  test('encerramento e painel usam o mesmo financeiro', () => {
    const financeiro = buildFinanceiroFromResumo({
      valorVendido: 50,
      valorRecebido: 50
    });
    const painel = buildPainelLateral({ valorVendido: 50, valorRecebido: 50 }, [], financeiro);
    const enc = buildCentralEncerramento({
      consignacao: { id: 1, clienteNome: 'A' },
      resumo: { itens: [] },
      financeiro
    });
    expect(painel.valorVenda).toBe(50);
    expect(painel.saldoEmAberto).toBe(0);
    expect(enc.financeiro.valorVenda).toBe(50);
    expect(enc.financeiro.valorRecebido).toBe(50);
    expect(enc.financeiro.saldoEmAberto).toBe(0);
    expect(enc.financeiro.quitado).toBe(true);
    expect(assertMesmoFinanceiro(financeiro, painel.financeiro)).toBe(true);
    expect(assertMesmoFinanceiro(financeiro, enc.financeiro)).toBe(true);
  });

  test('aliases de entrada convergem para nomes oficiais', () => {
    const a = buildFinanceiroFromResumo({ totalVendido: 10, totalPago: 4 });
    const b = buildFinanceiroFromResumo({ valorVendido: 10, valorPago: 4 });
    expect(a).toEqual(b);
    expect(Object.keys(a).sort()).toEqual([
      'saldoEmAberto',
      'situacaoFinanceira',
      'valorRecebido',
      'valorVenda'
    ]);
  });
});
