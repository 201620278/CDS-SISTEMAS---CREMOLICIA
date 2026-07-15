/**
 * STAB-06.6.1 — Integridade dos itens da Prestação (nome / status / obs / SSOT)
 */

const {
  mapItemConsignacao,
  mapItensCacheParaPrestacao,
  buildItensFromMovimentacoes,
  enriquecerItensPrestacao,
  syncStatusOperacional,
  PRODUTO_NAO_LOCALIZADO,
  PLACEHOLDER_PRODUTO_RE
} = require('../../pages/PrestacaoContas/fecharConsignacaoMappers');
const { aplicarValorState } = require('../../pages/PrestacaoContas/gradeConsistencia');
const { ItemConsignacaoResponse } = require('../../../../../backend/motores/motor-comercial/http/dto/ConsignacaoDTO');

describe('STAB-06.6.1 ItemConsignacao', () => {
  test('DTO transporta produtoNome, codigo, unidade, status e observacao', () => {
    const dto = ItemConsignacaoResponse.toJSON({
      id: 10,
      consignacaoId: 1,
      produtoId: 3,
      produtoNome: 'Leite Integral',
      codigo: 'LT-01',
      unidade: 'UN',
      quantidadeEntregue: 10,
      quantidadeVendida: 4,
      quantidadeDevolvida: 2,
      quantidadePerdida: 1,
      quantidadeCortesia: 0,
      precoUnitario: 5,
      observacao: 'Frio',
      saldo: 3
    });

    expect(dto.produtoId).toBe(3);
    expect(dto.produtoNome).toBe('Leite Integral');
    expect(dto.codigo).toBe('LT-01');
    expect(dto.unidade).toBe('UN');
    expect(dto.valorUnitario).toBe(5);
    expect(dto.quantidadeEntregue).toBe(10);
    expect(dto.quantidadeVendida).toBe(4);
    expect(dto.quantidadeDevolvida).toBe(2);
    expect(dto.quantidadePerda).toBe(1);
    expect(dto.quantidadeCortesia).toBe(0);
    expect(dto.saldo).toBe(3);
    expect(dto.status).toBe('PENDENTE');
    expect(dto.statusLabel).toBe('Pendente');
    expect(dto.observacao).toBe('Frio');
  });

  test('mapItemConsignacao usa nome real e rejeita placeholder Produto #', () => {
    const item = mapItemConsignacao({
      id: 1,
      produtoId: 1,
      produto: 'Produto #1',
      produtoNome: 'Queijo Minas',
      quantidadeEntregue: 5,
      quantidadeVendida: 0,
      precoUnitario: 10
    });
    expect(item.produtoNome).toBe('Queijo Minas');
    expect(item.produto).toBe('Queijo Minas');
    expect(PLACEHOLDER_PRODUTO_RE.test(item.produto)).toBe(false);
  });

  test('produto inexistente → ⚠ Produto não localizado (sem Produto #)', () => {
    const item = mapItemConsignacao({
      id: 2,
      produtoId: 99,
      quantidadeEntregue: 1
    });
    expect(item.produtoNome).toBe(PRODUTO_NAO_LOCALIZADO);
    expect(item.produto).toBe(PRODUTO_NAO_LOCALIZADO);
    expect(item.produto).not.toMatch(/Produto #\d+/);
  });

  test('status operacional sempre preenchido', () => {
    const pendente = syncStatusOperacional(mapItemConsignacao({
      produtoNome: 'A',
      quantidadeEntregue: 5,
      quantidadeVendida: 2
    }));
    expect(pendente.status).toBe('PENDENTE');
    expect(pendente.statusLabel).toBe('Pendente');

    const liquidado = syncStatusOperacional(mapItemConsignacao({
      produtoNome: 'B',
      quantidadeEntregue: 3,
      quantidadeVendida: 3
    }));
    expect(liquidado.status).toBe('LIQUIDADO');
    expect(liquidado.statusLabel).toBe('Liquidado');
  });

  test('observacao marca dirty para persistência', () => {
    const item = mapItemConsignacao({
      produtoNome: 'A',
      quantidadeEntregue: 1,
      observacao: ''
    });
    aplicarValorState(item, 'observacao', 'Retorno parcial');
    expect(item.observacao).toBe('Retorno parcial');
    expect(item.dirty).toBe(true);
    expect(item.dirtyCampos.observacao).toBe(true);
  });

  test('enriquecerItensPrestacao herda produtoNome do DTO oficial', () => {
    const itens = enriquecerItensPrestacao(
      [{ enviado: 5, vendido: 1 }],
      [{
        id: 10,
        produtoId: 3,
        produtoNome: 'Leite Integral',
        codigo: 'L1',
        unidade: 'UN',
        quantidade: 5,
        precoUnitario: 4,
        observacao: 'nota'
      }]
    );
    expect(itens[0].produtoNome).toBe('Leite Integral');
    expect(itens[0].produto).toBe('Leite Integral');
    expect(itens[0].codigo).toBe('L1');
    expect(itens[0].observacao).toBe('nota');
    expect(itens[0].statusLabel).toBeTruthy();
  });

  test('cache e movimentações passam pelo mesmo mapItemConsignacao', () => {
    const cache = mapItensCacheParaPrestacao([
      { produtoId: 1, produtoNome: 'Pão', quantidade: 2, precoUnitario: 3 }
    ]);
    expect(cache[0].produto).toBe('Pão');

    const movs = buildItensFromMovimentacoes([
      {
        id: 1,
        consignacaoItemId: 10,
        tipoMovimentacao: 'ENTREGA',
        quantidade: 5,
        valor: 50,
        snapshot: { item: { produtoId: 3, produtoNome: 'Leite Integral' } }
      }
    ]);
    expect(movs[0].produtoNome).toBe('Leite Integral');
  });
});
