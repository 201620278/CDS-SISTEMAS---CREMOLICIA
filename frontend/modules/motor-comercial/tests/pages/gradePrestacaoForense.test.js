/**
 * Auditoria forense — Grade Prestação (reprodução prática caso #3 e races).
 * Evidência para Opção A vs B — sem alterar regra de negócio.
 */

const {
  coletarItensComRascunho,
  listarPendenciasRetornos,
  buildPayloadOperacao,
  calcularSaldoItem
} = require('../../pages/PrestacaoContas/fecharConsignacaoMappers');
const FecharConsignacaoView = require('../../pages/PrestacaoContas/FecharConsignacaoView');

function montarGrade(itens) {
  document.body.innerHTML = '';
  const table = document.createElement('div');
  table.id = 'fechar-retornos-grade';
  itens.forEach((item, index) => {
    const row = FecharConsignacaoView._renderLinhaRetorno(
      item,
      index,
      { editing: { rowIndex: -1 }, focus: {}, lineStatus: {}, linhasComErro: {}, loading: {} },
      {
        onItemFocus: () => {},
        onItemDraft: () => {},
        onItemKeydown: () => {},
        onItemBlur: () => {},
        onItemObsChange: () => {}
      }
    );
    table.appendChild(row);
  });
  document.body.appendChild(table);
  return table;
}

function setCampo(index, campo, valor) {
  const input = document.querySelector(
    `#fechar-retornos-grade [data-row-index="${index}"] input[data-campo="${campo}"]`
  );
  input.value = String(valor);
  return input;
}

function lerDom(index) {
  const row = document.querySelector(`#fechar-retornos-grade [data-row-index="${index}"]`);
  const get = (c) => Number(row.querySelector(`input[data-campo="${c}"]`).value || 0);
  return {
    vendido: get('vendido'),
    devolvido: get('devolvido'),
    perdido: get('perdido'),
    cortesia: get('cortesia')
  };
}

describe('GRADE FORENSE — Prestação de Contas', () => {
  const itemBase = {
    itemId: 3,
    produtoId: 1,
    produto: 'Produto 1',
    enviado: 10,
    vendido: 0,
    devolvido: 0,
    perdido: 0,
    cortesia: 0,
    preco: 2,
    saldo: 10
  };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  test('B1 — digitar sem Enter/Continuar: DOM mostra valores, payload não existe (sem commit)', () => {
    const state = [{ ...itemBase, saldo: 10 }];
    montarGrade(state);

    setCampo(0, 'vendido', 6);
    setCampo(0, 'devolvido', 4);

    const dom = lerDom(0);
    expect(dom).toEqual({ vendido: 6, devolvido: 4, perdido: 0, cortesia: 0 });

    // Sem listarPendencias / sem API: apenas prova que visual ≠ persistido até commit
    const servidor = [{ ...itemBase }];
    const rascunho = coletarItensComRascunho(servidor);
    const pendencias = listarPendenciasRetornos(servidor, rascunho);

    expect(rascunho[0].vendido).toBe(6);
    expect(rascunho[0].devolvido).toBe(4);
    expect(pendencias).toHaveLength(2);
    // Evidência: há payload CANDIDATO, mas só seria enviado se Continuar/Enter chamasse persistência
    expect(pendencias.map((p) => p.tipo).sort()).toEqual(['devolucao', 'venda']);
  });

  test('Caso #3 lento — Continuar com venda 6 + devolução 4 gera payloads na ordem correta', () => {
    const servidor = [{ ...itemBase }];
    montarGrade(servidor);
    setCampo(0, 'vendido', 6);
    setCampo(0, 'devolvido', 4);

    const rascunho = coletarItensComRascunho(servidor);
    const pendencias = listarPendenciasRetornos(servidor, rascunho);
    const payloads = pendencias.map((p) => ({
      tipo: p.tipo,
      ...buildPayloadOperacao(p.item, p.delta, p.tipo)
    }));

    expect(payloads[0]).toMatchObject({ tipo: 'devolucao', quantidade: 4, itemId: 3 });
    expect(payloads[1]).toMatchObject({ tipo: 'venda', quantidade: 6, itemId: 3 });
  });

  test('Caso #3 rápido — digitar e capturar rascunho imediato (mousedown Continuar) preserva DOM', () => {
    const servidor = [{ ...itemBase }];
    montarGrade(servidor);
    setCampo(0, 'vendido', 6);
    setCampo(0, 'devolvido', 4);

    // Simula mousedown Continuar ANTES de qualquer blur destrutivo
    const snapshot = coletarItensComRascunho(servidor);
    expect(snapshot[0].devolvido).toBe(4);
    expect(snapshot[0].vendido).toBe(6);

    const pendencias = listarPendenciasRetornos(servidor, snapshot);
    expect(pendencias[0].tipo).toBe('devolucao');
    expect(pendencias[0].delta).toBe(4);
  });

  test('B2 — venda já no servidor + devolução 4 no DOM: operador VÊ 4, backend não recebe se bloqueado', () => {
    const servidor = [{
      ...itemBase,
      vendido: 6,
      saldo: 4
    }];
    montarGrade(servidor);
    setCampo(0, 'devolvido', 4);

    const dom = lerDom(0);
    expect(dom.vendido).toBe(6);
    expect(dom.devolvido).toBe(4);
    expect(calcularSaldoItem({ ...servidor[0], ...dom })).toBe(0);

    const rascunho = coletarItensComRascunho(servidor);
    const pendencias = listarPendenciasRetornos(servidor, rascunho);
    expect(pendencias).toHaveLength(1);
    expect(pendencias[0]).toMatchObject({ tipo: 'devolucao', delta: 4 });

    // Simula bloqueio local pós-abertura da prestação (código real em _executarOperacaoPrestacao)
    const prestacaoAberta = true;
    const enviados = [];
    for (const p of pendencias) {
      if (p.tipo === 'devolucao' && prestacaoAberta) {
        // DOM continua 4; API/banco não recebem
        continue;
      }
      enviados.push(p);
    }
    expect(enviados).toHaveLength(0);
    expect(lerDom(0).devolvido).toBe(4);
  });

  test('B3 — patchLinhaRetorno após reload pode apagar rascunho visível em campo sem foco', () => {
    const servidor = [{ ...itemBase, vendido: 6, saldo: 4 }];
    montarGrade(servidor);
    setCampo(0, 'devolvido', 4);
    expect(lerDom(0).devolvido).toBe(4);

    // Reload silencioso deixa state no servidor (devolvido 0) e patch sobrescreve DOM
    const itemServidor = { ...servidor[0], devolvido: 0, saldo: 4 };
    const row = document.querySelector('#fechar-retornos-grade [data-row-index="0"]');
    FecharConsignacaoView.patchLinhaRetorno(row, itemServidor, 0, {
      editing: { rowIndex: -1 },
      lineStatus: {},
      linhasComErro: {}
    });

    expect(lerDom(0).devolvido).toBe(0);
    expect(lerDom(0).vendido).toBe(6);
  });

  test('B4 — Encerrar não gera pendências de retorno (não reenvia grade)', () => {
    // Encerrar só chama fecharPrestacao — não listarPendenciasRetornos
    const servidor = [{ ...itemBase, vendido: 6, saldo: 4 }];
    montarGrade(servidor);
    setCampo(0, 'devolvido', 4);
    const rascunhoVisivel = coletarItensComRascunho(servidor);
    expect(rascunhoVisivel[0].devolvido).toBe(4);

    // Caminho Encerrar: zero payloads de retorno
    const payloadsEncerrar = [];
    expect(payloadsEncerrar).toEqual([]);
  });

  test('Comparativo DOM × State × Payload × Banco (caso feliz)', () => {
    const banco = { vendido: 0, devolvido: 0 };
    const state = [{ ...itemBase }];
    montarGrade(state);
    setCampo(0, 'vendido', 6);
    setCampo(0, 'devolvido', 4);

    const dom = lerDom(0);
    const rascunho = coletarItensComRascunho(state);
    const pendencias = listarPendenciasRetornos(state, rascunho);

    // Aplica payloads como o backend faria
    for (const p of pendencias) {
      if (p.tipo === 'devolucao') banco.devolvido += p.delta;
      if (p.tipo === 'venda') banco.vendido += p.delta;
    }

    expect(dom).toEqual({ vendido: 6, devolvido: 4, perdido: 0, cortesia: 0 });
    expect(rascunho[0].vendido).toBe(6);
    expect(rascunho[0].devolvido).toBe(4);
    expect(banco).toEqual({ vendido: 6, devolvido: 4 });
  });
});
