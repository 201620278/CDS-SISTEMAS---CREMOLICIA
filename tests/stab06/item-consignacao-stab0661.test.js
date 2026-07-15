/**
 * STAB-06.6.1 — DTO ItemConsignacao + mapper SQL
 */
const assert = require('assert');
const { ItemConsignacaoResponse } = require('../../backend/motores/motor-comercial/http/dto/ConsignacaoDTO');
const { mapConsignacaoItemFromRow } = require('../../backend/motores/motor-comercial/utils/comercialMapper');

async function run() {
  const mapped = mapConsignacaoItemFromRow({
    id: 7,
    consignacao_id: 1,
    produto_id: 3,
    produto_nome: 'Leite Integral',
    produto_codigo: 'LT-01',
    produto_unidade: 'UN',
    quantidade_entregue: 10,
    quantidade_devolvida: 1,
    quantidade_vendida: 4,
    quantidade_perdida: 0,
    quantidade_cortesia: 0,
    preco_unitario: 2.5,
    observacao: 'Geladeira',
    subtotal_entregue: 25,
    subtotal_acertado: 0,
    created_at: null,
    updated_at: null
  });

  assert.strictEqual(mapped.produtoNome, 'Leite Integral');
  assert.strictEqual(mapped.codigo, 'LT-01');
  assert.strictEqual(mapped.unidade, 'UN');
  assert.strictEqual(mapped.saldo, 5);
  assert.strictEqual(mapped.observacao, 'Geladeira');

  const dto = ItemConsignacaoResponse.toJSON(mapped);
  assert.strictEqual(dto.produtoNome, 'Leite Integral');
  assert.strictEqual(dto.valorUnitario, 2.5);
  assert.strictEqual(dto.quantidadePerda, 0);
  assert.strictEqual(dto.status, 'PENDENTE');
  assert.strictEqual(dto.observacao, 'Geladeira');

  const semNome = ItemConsignacaoResponse.toJSON({
    id: 1,
    produtoId: 9,
    quantidadeEntregue: 1,
    quantidadeVendida: 1,
    precoUnitario: 1
  });
  assert.strictEqual(semNome.produtoNome, null);
  assert.strictEqual(semNome.status, 'LIQUIDADO');

  console.log('OK item-consignacao-stab0661');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
