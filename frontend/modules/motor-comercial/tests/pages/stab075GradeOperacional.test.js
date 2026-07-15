/**
 * STAB-07.5 — Grade operacional Registrar Retornos
 */

const FecharConsignacaoView = require('../../pages/PrestacaoContas/FecharConsignacaoView');

describe('STAB-07.5 grade operacional', () => {
  const itens = Array.from({ length: 25 }, (_, i) => ({
    produtoNome: `Picolé de Teste ${i + 1}`,
    enviado: 10,
    vendido: i % 3 === 0 ? 10 : 4,
    devolvido: i % 3 === 0 ? 0 : 3,
    perdido: 0,
    cortesia: 0,
    saldo: i % 3 === 0 ? 0 : 3,
    observacao: '',
    status: i % 3 === 0 ? 'LIQUIDADO' : 'PENDENTE'
  }));

  test('renderiza grade (table) sem cards e com sidebar financeira', () => {
    const el = FecharConsignacaoView.renderRetornos(
      {
        resumoPrestacao: { itens },
        painel: {
          produtosVendidos: 40,
          produtosDevolvidos: 10,
          perdas: 0,
          cortesias: 1,
          pendentes: 12,
          financeiro: { valorVenda: 160, valorRecebido: 120, saldoEmAberto: 40, situacaoFinanceira: 'PARCIALMENTE_RECEBIDA' }
        },
        snapshot: {
          financeiro: { valorVenda: 160, valorRecebido: 120, saldoEmAberto: 40, situacaoFinanceira: 'PARCIALMENTE_RECEBIDA' }
        },
        retornosUi: { page: 1, pageSize: 10 },
        editing: {},
        lineStatus: {},
        linhasComErro: {}
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

    expect(el.querySelector('.cds-retornos-card')).toBeNull();
    expect(el.querySelector('table.cds-retornos-table')).toBeTruthy();
    expect(el.querySelector('#fechar-retornos-grade')).toBeTruthy();
    expect(el.querySelector('#fechar-painel-lateral')).toBeTruthy();
    expect(el.textContent).toMatch(/Resumo Financeiro/);
    expect(el.textContent).toMatch(/Resumo por natureza/);
    expect(el.textContent).toMatch(/Resumo Rápido/);
    expect(el.textContent).toMatch(/Picolé de Teste 1/);
    expect(el.textContent).not.toMatch(/Produto #1/);
    expect(el.querySelectorAll('tbody tr').length).toBe(10);
    const colunas = Array.from(el.querySelectorAll('thead th')).map((th) => th.dataset.col);
    expect(colunas.indexOf('devolvido')).toBeLessThan(colunas.indexOf('vendido'));
    const campos = Array.from(el.querySelectorAll('tbody tr:first-child input[data-campo]'))
      .map((input) => input.dataset.campo);
    expect(campos.indexOf('devolvido')).toBeLessThan(campos.indexOf('vendido'));
  });

  test('busca filtra produtos em tempo real (UI)', () => {
    const filtered = FecharConsignacaoView._filtrarItensRetornos(
      itens,
      { busca: 'Teste 2' },
      {}
    );
    expect(filtered.every(({ item }) => String(item.produtoNome).includes('Teste 2'))).toBe(true);
  });

  test('paginação 10/20/50/100', () => {
    const page = FecharConsignacaoView._paginarItens(
      itens.map((item, index) => ({ item, index })),
      2,
      10
    );
    expect(page.pageItems).toHaveLength(10);
    expect(page.from).toBe(11);
    expect(page.to).toBe(20);
    expect(page.totalPages).toBe(3);
  });

  test('badge status Liquidado/Pendente', () => {
    const liquidado = FecharConsignacaoView._statusOperacionalItem(
      { saldo: 0, status: 'LIQUIDADO' },
      0,
      {}
    );
    const pendente = FecharConsignacaoView._statusOperacionalItem(
      { saldo: 2 },
      1,
      {}
    );
    expect(liquidado.label).toBe('Liquidado');
    expect(pendente.label).toBe('Pendente');
  });
});
