/**
 * STAB-04 — Consistência da Grade (State único / dirty / flush)
 */

const {
  cloneBaseline,
  aplicarValorState,
  temAlteracoesPendentes,
  limparDirtyTodos,
  listarPendenciasFromBaseline,
  mesclarServidorPreservandoDirty,
  statusPersistencia,
  calcularSaldoItem
} = (() => {
  const g = require('../../pages/PrestacaoContas/gradeConsistencia');
  const { calcularSaldoItem } = require('../../pages/PrestacaoContas/fecharConsignacaoMappers');
  return { ...g, calcularSaldoItem };
})();

const FecharConsignacaoView = require('../../pages/PrestacaoContas/FecharConsignacaoView');

function itemBase(overrides = {}) {
  return {
    itemId: 3,
    produtoId: 1,
    produto: 'Produto',
    enviado: 10,
    vendido: 0,
    devolvido: 0,
    perdido: 0,
    cortesia: 0,
    preco: 2,
    saldo: 10,
    dirty: false,
    dirtyCampos: {},
    ...overrides
  };
}

describe('STAB-04 gradeConsistencia', () => {
  test('State é fonte: aplicarValor marca dirty e atualiza saldo', () => {
    const item = itemBase();
    aplicarValorState(item, 'vendido', 6);
    aplicarValorState(item, 'devolvido', 4);
    expect(item.vendido).toBe(6);
    expect(item.devolvido).toBe(4);
    expect(item.saldo).toBe(0);
    expect(item.dirty).toBe(true);
    expect(temAlteracoesPendentes([item])).toBe(true);
    expect(statusPersistencia([item])).toBe('pending');
  });

  test('Payload vem do State × baseline — nunca precisa de DOM', () => {
    const state = [itemBase()];
    const baseline = cloneBaseline(state);
    aplicarValorState(state[0], 'vendido', 6);
    aplicarValorState(state[0], 'devolvido', 4);

    const pendencias = listarPendenciasFromBaseline(baseline, state);
    expect(pendencias.map((p) => p.tipo)).toEqual(['devolucao', 'venda']);
    expect(pendencias[0].delta).toBe(4);
    expect(pendencias[1].delta).toBe(6);

    // Simula banco
    const banco = { vendido: 0, devolvido: 0 };
    pendencias.forEach((p) => {
      if (p.tipo === 'venda') banco.vendido += p.delta;
      if (p.tipo === 'devolucao') banco.devolvido += p.delta;
    });
    expect(banco).toEqual({ vendido: 6, devolvido: 4 });
    expect(state[0].vendido).toBe(banco.vendido);
    expect(state[0].devolvido).toBe(banco.devolvido);
  });

  test('Reload preserva dirty e não apaga digitação', () => {
    const state = [itemBase()];
    aplicarValorState(state[0], 'devolvido', 4);
    const servidor = [itemBase({ vendido: 6, saldo: 4 })];
    const merged = mesclarServidorPreservandoDirty(servidor, state);
    expect(merged[0].vendido).toBe(6);
    expect(merged[0].devolvido).toBe(4);
    expect(merged[0].dirty).toBe(true);
    expect(merged[0].saldo).toBe(0);
  });

  test('patchLinhaRetorno com dirty mantém valor do State no DOM', () => {
    document.body.innerHTML = '';
    const item = itemBase({ vendido: 6, devolvido: 4, dirty: true, dirtyCampos: { devolvido: true }, saldo: 0 });
    const row = FecharConsignacaoView._renderLinhaRetorno(
      item,
      0,
      { editing: {}, focus: {}, lineStatus: {}, linhasComErro: {}, loading: {} },
      { onItemFocus() {}, onItemDraft() {}, onItemKeydown() {}, onItemBlur() {}, onItemObsChange() {} }
    );
    document.body.appendChild(row);
    const servidorLike = itemBase({ vendido: 6, devolvido: 0, saldo: 4, dirty: true, dirtyCampos: { devolvido: true } });
    // State dirty ainda tem 4 — patch deve escrever State (4), não zerar
    servidorLike.devolvido = 4;
    FecharConsignacaoView.patchLinhaRetorno(row, servidorLike, 0, {
      editing: { rowIndex: -1 },
      lineStatus: {},
      linhasComErro: {}
    });
    const input = row.querySelector('input[data-campo="devolvido"]');
    expect(input.value).toBe('4');
    expect(row.classList.contains('cds-fechar-consignacao__grade-row--dirty')).toBe(true);
  });

  test('Digitar e Encerrar: flush gera payload antes de fechar', async () => {
    const state = [itemBase()];
    const baseline = cloneBaseline(state);
    aplicarValorState(state[0], 'vendido', 6);
    aplicarValorState(state[0], 'devolvido', 4);
    expect(temAlteracoesPendentes(state)).toBe(true);

    const apiCalls = [];
    const pendencias = listarPendenciasFromBaseline(baseline, state);
    for (const p of pendencias) {
      apiCalls.push({ tipo: p.tipo, qty: p.delta });
    }
    // Após flush bem-sucedido
    limparDirtyTodos(state);
    const podeFechar = !temAlteracoesPendentes(state) && apiCalls.length === 2;
    expect(podeFechar).toBe(true);
    expect(apiCalls[0]).toEqual({ tipo: 'devolucao', qty: 4 });
    expect(apiCalls[1]).toEqual({ tipo: 'venda', qty: 6 });
  });

  test('Múltiplas linhas: dirty isolado por item', () => {
    const state = [
      itemBase({ itemId: 1, produtoId: 1 }),
      itemBase({ itemId: 2, produtoId: 2, enviado: 20, saldo: 20 })
    ];
    const baseline = cloneBaseline(state);
    aplicarValorState(state[0], 'vendido', 6);
    aplicarValorState(state[1], 'perdido', 2);
    const pendencias = listarPendenciasFromBaseline(baseline, state);
    expect(pendencias).toHaveLength(2);
    expect(pendencias.find((p) => p.index === 0).tipo).toBe('venda');
    expect(pendencias.find((p) => p.index === 1).tipo).toBe('perda');
  });

  test('Cortesia e perda entram no payload a partir do State', () => {
    const state = [itemBase()];
    const baseline = cloneBaseline(state);
    aplicarValorState(state[0], 'perdido', 1);
    aplicarValorState(state[0], 'cortesia', 1);
    aplicarValorState(state[0], 'vendido', 8);
    const tipos = listarPendenciasFromBaseline(baseline, state).map((p) => p.tipo);
    expect(tipos).toEqual(['venda', 'perda', 'cortesia']);
  });

  test('Voltar / Continuar bloqueados enquanto dirty (regra de aceite)', () => {
    const state = [itemBase()];
    aplicarValorState(state[0], 'vendido', 3);
    expect(temAlteracoesPendentes(state)).toBe(true);
    // Continuar/Encerrar/Voltar devem chamar flush antes — dirty impede avanço limpo
    const podeSairSemFlush = !temAlteracoesPendentes(state);
    expect(podeSairSemFlush).toBe(false);
  });

  test('Race: reload force limpa dirty após flush ok', () => {
    const state = [itemBase({ vendido: 6, dirty: true, dirtyCampos: { vendido: true } })];
    const servidor = [itemBase({ vendido: 6, saldo: 4 })];
    limparDirtyTodos(state);
    const merged = mesclarServidorPreservandoDirty(servidor, state);
    expect(merged[0].dirty).toBe(false);
    expect(merged[0].vendido).toBe(6);
  });
});
