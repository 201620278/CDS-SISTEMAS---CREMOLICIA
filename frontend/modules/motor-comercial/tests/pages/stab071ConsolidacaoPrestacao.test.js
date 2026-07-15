/**
 * STAB-07.1 — Consolidação Prestação (Remoção step Pagamento + sem auto-pagamento)
 */

const {
  MOMENTOS_FECHAMENTO,
  STEP_RETORNOS,
  STEP_RESUMO,
  STEP_ENCERRAMENTO,
  inicializarMomentos
} = require('../../pages/PrestacaoContas/fecharConsignacaoMappers');
const {
  buildFinanceiroFromResumo,
  buildPrestacaoSnapshot,
  SITUACAO,
  labelSituacaoFinanceira
} = require('../../pages/PrestacaoContas/prestacaoFinanceiroSnapshot');

describe('STAB-07.1 consolidação prestação', () => {
  test('navegação: Retornos → Resumo Final (sem Pagamento)', () => {
    expect(MOMENTOS_FECHAMENTO.map((m) => m.key)).toEqual([
      'retornos',
      'conferencia',
      'encerramento'
    ]);
    expect(STEP_RETORNOS).toBe(0);
    expect(STEP_RESUMO).toBe(1);
    expect(STEP_ENCERRAMENTO).toBe(2);
    const steps = inicializarMomentos(false);
    expect(steps[0].state).toBe('current');
    expect(steps.find((s) => s.key === 'pagamento')).toBeUndefined();
  });

  test('cenário 1 — venda 30 pagamento 20 → Parcial', () => {
    const fin = buildFinanceiroFromResumo({
      valorVendido: 30,
      totalPago: 20
    });
    expect(fin).toEqual({
      valorVenda: 30,
      valorRecebido: 20,
      saldoEmAberto: 10,
      situacaoFinanceira: SITUACAO.PARCIALMENTE_RECEBIDA
    });
    expect(labelSituacaoFinanceira(fin.situacaoFinanceira)).toBe('Parcial');
  });

  test('cenário 2 — quitada após 20+10', () => {
    const fin = buildFinanceiroFromResumo({ valorVenda: 30, valorRecebido: 30 });
    expect(fin.saldoEmAberto).toBe(0);
    expect(fin.situacaoFinanceira).toBe(SITUACAO.QUITADA);
    expect(labelSituacaoFinanceira(fin.situacaoFinanceira)).toBe('Quitada');
  });

  test('cenário 3 — sem pagamento → Em Aberto', () => {
    const fin = buildFinanceiroFromResumo({ valorVendido: 30, totalPago: 0 });
    expect(fin.valorRecebido).toBe(0);
    expect(fin.saldoEmAberto).toBe(30);
    expect(fin.situacaoFinanceira).toBe(SITUACAO.EM_ABERTO);
    expect(labelSituacaoFinanceira(fin.situacaoFinanceira)).toBe('Em Aberto');
  });

  test('PrestacaoSnapshot SSOT inclui financeiro + itens + fiscal', () => {
    const snap = buildPrestacaoSnapshot(
      { valorVendido: 30, totalPago: 20, itens: [{ id: 1 }] },
      {
        itens: [{ id: 1, produtoNome: 'X' }],
        fiscal: { codigo: 'PENDENTE', label: 'Pendente' },
        vendaOficial: null,
        statusOperacional: 'EM_ATENDIMENTO'
      }
    );
    expect(snap.financeiro.valorRecebido).toBe(20);
    expect(snap.itens).toHaveLength(1);
    expect(snap.fiscal.codigo).toBe('PENDENTE');
    expect(snap.statusOperacional).toBe('EM_ATENDIMENTO');
  });

  test('código-fonte: _goNext não chama _registrarPagamento', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.join(__dirname, '../../pages/PrestacaoContas/index.js'),
      'utf8'
    );
    const goNextBody = src.match(/_goNext\(\)\s*\{[\s\S]*?\n  async _goBack/)?.[0] || '';
    expect(goNextBody).toContain('STEP_RETORNOS');
    expect(goNextBody).not.toMatch(/_registrarPagamento\s*\(/);
    expect(goNextBody).not.toMatch(/pagamentoForm\.valor\s*=\s*String\(saldo/);
    expect(src).not.toMatch(/_sugerirValorPagamento/);
  });
});
