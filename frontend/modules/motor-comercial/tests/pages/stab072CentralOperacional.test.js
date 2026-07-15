/**
 * STAB-07.2 — Central Operacional (Resumo Final)
 */

const {
  buildPagamentosHistorico,
  buildPrestacaoSnapshot,
  buildFinanceiroFromResumo
} = require('../../pages/PrestacaoContas/prestacaoFinanceiroSnapshot');
const {
  buildTimelineOficial,
  renderTimelineElement
} = require('../../pages/PrestacaoContas/prestacaoOperacionalConsolidacao');

describe('STAB-07.2 central operacional', () => {
  test('buildPagamentosHistorico filtra só PAGAMENTO', () => {
    const lista = buildPagamentosHistorico([
      { id: 1, tipoMovimentacao: 'VENDA', valor: 30 },
      {
        id: 2,
        tipoMovimentacao: 'PAGAMENTO',
        valor: 20,
        createdAt: '2026-07-14T10:00:00Z',
        snapshot: { formaPagamento: 'PIX', usuarioNome: 'Ana' }
      },
      {
        id: 3,
        tipoMovimentacao: 'PAGAMENTO',
        valor: 10,
        createdAt: '2026-07-14T11:00:00Z',
        formaPagamento: 'DINHEIRO',
        usuarioNome: 'Ana'
      }
    ]);
    expect(lista).toHaveLength(2);
    expect(lista[0].valor).toBe(10);
    expect(lista[1].forma).toBe('PIX');
  });

  test('snapshot inclui pagamentos + timeline + log', () => {
    const financeiroBase = buildFinanceiroFromResumo({ valorVendido: 30, totalPago: 20 });
    const timeline = buildTimelineOficial({
      consignacao: { status: 'EM_PRESTACAO', dataEntrega: '2026-07-01' },
      financeiro: financeiroBase,
      faturamento: null,
      currentStep: 3,
      encerrado: false
    });
    const snap = buildPrestacaoSnapshot(
      { valorVendido: 30, totalPago: 20 },
      {
        pagamentos: [{ valor: 20, forma: 'PIX' }],
        timeline,
        logOperacional: [{ acao: 'Pagamento registrado', em: new Date().toISOString() }],
        fiscal: { codigo: 'PENDENTE', label: 'Pendente' }
      }
    );
    expect(snap.pagamentos).toHaveLength(1);
    expect(snap.timeline.length).toBe(5);
    expect(snap.logOperacional[0].acao).toMatch(/Pagamento/);
    expect(snap.financeiro.situacaoFinanceira).toBe('PARCIALMENTE_RECEBIDA');
  });

  test('timeline vertical renderiza marcas', () => {
    const timeline = buildTimelineOficial({
      consignacao: { status: 'ENTREGUE', dataEntrega: '2026-07-01' },
      financeiro: { valorVenda: 30, valorRecebido: 30, saldoEmAberto: 0 },
      faturamento: {
        vendaId: 1,
        situacaoFiscal: 'REJEITADA',
        nfce: { motivo: 'NCM' }
      },
      currentStep: 3,
      encerrado: false
    });
    const el = renderTimelineElement(timeline, { vertical: true });
    expect(el.className).toMatch(/vertical/);
    expect(el.textContent).toMatch(/Entrega/);
    expect(el.textContent).toMatch(/NFC-e/);
  });
});
