/**
 * STAB-07.4 — Redesign oficial da Prestação (UX) — regressão pós 07.5
 */

const FecharConsignacaoView = require('../../pages/PrestacaoContas/FecharConsignacaoView');
const {
  buildPrestacaoSnapshot,
  buildFinanceiroFromResumo
} = require('../../pages/PrestacaoContas/prestacaoFinanceiroSnapshot');
const { CAMPOS_RETORNO_ORDEM } = require('../../pages/PrestacaoContas/fecharConsignacaoMappers');

describe('STAB-07.4 redesign oficial', () => {
  test('ordem dos campos: Vendido antes de Devolvido', () => {
    expect(CAMPOS_RETORNO_ORDEM[0]).toBe('vendido');
    expect(CAMPOS_RETORNO_ORDEM[1]).toBe('devolvido');
  });

  test('Registrar Retornos usa grade (não cards)', () => {
    const el = FecharConsignacaoView.renderRetornos(
      {
        resumoPrestacao: {
          itens: [{
            produtoNome: 'Picolé Morango',
            enviado: 10,
            vendido: 4,
            devolvido: 3,
            perdido: 1,
            cortesia: 0,
            saldo: 2,
            observacao: ''
          }]
        },
        painel: {
          produtosVendidos: 4,
          produtosDevolvidos: 3,
          perdas: 1,
          pendentes: 2,
          financeiro: { valorVenda: 30, valorRecebido: 0, saldoEmAberto: 30, situacaoFinanceira: 'EM_ABERTO' }
        },
        snapshot: {
          financeiro: { valorVenda: 30, valorRecebido: 0, saldoEmAberto: 30, situacaoFinanceira: 'EM_ABERTO' }
        },
        editing: {},
        lineStatus: {},
        linhasComErro: {},
        retornosUi: { page: 1, pageSize: 10 }
      },
      {
        onItemFocus: () => {},
        onItemDraft: () => {},
        onItemKeydown: () => {},
        onItemBlur: () => {},
        onItemObsChange: () => {},
        onRetornosUiChange: () => {}
      }
    );

    expect(el.querySelector('.cds-retornos-table')).toBeTruthy();
    expect(el.querySelector('#fechar-retornos-grade')).toBeTruthy();
    expect(el.textContent).toMatch(/Picolé Morango/);
    expect(el.textContent).toMatch(/Resumo Rápido/);
    expect(el.querySelector('.cds-retornos-card')).toBeNull();
  });

  test('Estação Operacional: 2 colunas sem Timeline/Log; histórico sob demanda', () => {
    const financeiro = buildFinanceiroFromResumo({ valorVendido: 30, totalPago: 20 });
    const snap = buildPrestacaoSnapshot(
      { valorVendido: 30, totalPago: 20 },
      {
        pagamentos: [{ forma: 'PIX', valor: 20, data: new Date().toISOString(), operador: 'Ana' }],
        fiscal: { codigo: 'PENDENTE', label: 'Pendente' }
      }
    );

    const root = FecharConsignacaoView.renderConferenciaFinal(
      {
        consignacao: {
          id: 9,
          status: 'EM_PRESTACAO',
          clienteNome: 'Cliente Teste',
          documento: '123',
          dataEntrega: '2026-07-01',
          observacao: 'Entrega manhã'
        },
        clienteDetalhe: { nome: 'Cliente Teste' },
        faturamento: null,
        historico: [],
        pagamentoDraft: { valor: '', formaPagamento: 'PIX' },
        snapshot: { ...snap, financeiro }
      },
      {
        onPagamentoChange: () => {},
        onRegistrarPagamento: () => {},
        onAbrirHistoricoPagamentos: () => {}
      }
    );

    expect(root.querySelector('[data-card="financeiro"]')).toBeTruthy();
    expect(root.querySelector('[data-card="pagamentos"]')).toBeTruthy();
    expect(root.querySelector('[data-card="fiscal"]')).toBeTruthy();
    expect(root.querySelector('[data-card="info"]')).toBeTruthy();
    expect(root.querySelector('[data-card="timeline"]')).toBeNull();
    expect(root.querySelector('[data-card="log"]')).toBeNull();
  });

  test('modal de histórico lista colunas oficiais', () => {
    FecharConsignacaoView.abrirModalHistoricoPagamentos([
      {
        forma: 'PIX',
        valor: 20,
        data: '2026-07-14T18:32:00Z',
        operador: 'João',
        observacao: 'Parcial'
      }
    ]);
    const modal = document.querySelector('.cds-op-hist-modal-backdrop');
    expect(modal).toBeTruthy();
    expect(modal.textContent).toMatch(/PIX/);
    expect(modal.textContent).toMatch(/João/);
    modal.remove();
  });
});
