/**
 * HOTFIX-IND-01 — Entrada Produção Própria (regras oficiais)
 */
const assert = require('assert');
const {
  TIPO_ENTRADA_COMPRA_FORNECEDOR,
  TIPO_ENTRADA_PRODUCAO_PROPRIA,
  ORIGEM_MOV_PRODUCAO_PROPRIA,
  TIPO_MOV_ABASTECIMENTO_PRODUCAO,
  FORNECEDOR_PRODUCAO_PROPRIA_LABEL,
  OBS_PRODUCAO_PROPRIA_PADRAO,
  LOTE_ORIGEM_ABASTECIMENTO,
  normalizarTipoEntrada,
  isEntradaProducaoPropria,
  deveGerarFinanceiroEntrada,
  resolverCamposEntrada
} = require('../../backend/lib/entradaProducaoPropria');

assert.strictEqual(normalizarTipoEntrada(undefined), TIPO_ENTRADA_COMPRA_FORNECEDOR);
assert.strictEqual(normalizarTipoEntrada('COMPRA_FORNECEDOR'), TIPO_ENTRADA_COMPRA_FORNECEDOR);
assert.strictEqual(normalizarTipoEntrada('PRODUCAO_PROPRIA'), TIPO_ENTRADA_PRODUCAO_PROPRIA);
assert.strictEqual(normalizarTipoEntrada('produção própria'), TIPO_ENTRADA_PRODUCAO_PROPRIA);
assert.strictEqual(isEntradaProducaoPropria('PRODUCAO_PROPRIA'), true);
assert.strictEqual(isEntradaProducaoPropria('COMPRA_FORNECEDOR'), false);

assert.strictEqual(deveGerarFinanceiroEntrada('COMPRA_FORNECEDOR'), true);
assert.strictEqual(deveGerarFinanceiroEntrada('PRODUCAO_PROPRIA'), false);

const compra = resolverCamposEntrada({
  tipo_entrada: 'COMPRA_FORNECEDOR',
  fornecedor: 'Fornecedor XPTO',
  observacao: 'NF normal'
});
assert.strictEqual(compra.is_producao_propria, false);
assert.strictEqual(compra.fornecedor, 'Fornecedor XPTO');
assert.strictEqual(compra.origem_movimentacao, null);
assert.strictEqual(compra.tipo_movimentacao, null);
assert.strictEqual(compra.lote_origem, 'COMPRA');
assert.strictEqual(deveGerarFinanceiroEntrada(compra.tipo_entrada), true);

const producao = resolverCamposEntrada({
  tipo_entrada: 'PRODUCAO_PROPRIA',
  fornecedor: 'Qualquer coisa',
  observacao: ''
});
assert.strictEqual(producao.is_producao_propria, true);
assert.strictEqual(producao.fornecedor, FORNECEDOR_PRODUCAO_PROPRIA_LABEL);
assert.strictEqual(producao.observacao, OBS_PRODUCAO_PROPRIA_PADRAO);
assert.strictEqual(producao.origem_movimentacao, ORIGEM_MOV_PRODUCAO_PROPRIA);
assert.strictEqual(producao.tipo_movimentacao, TIPO_MOV_ABASTECIMENTO_PRODUCAO);
assert.strictEqual(producao.lote_origem, LOTE_ORIGEM_ABASTECIMENTO);
assert.strictEqual(deveGerarFinanceiroEntrada(producao.tipo_entrada), false);

const producaoObs = resolverCamposEntrada({
  tipo_entrada: 'PRODUCAO_PROPRIA',
  observacao: 'Lote manhã fábrica'
});
assert.strictEqual(producaoObs.observacao, 'Lote manhã fábrica');

console.log('OK — HOTFIX-IND-01 entrada produção própria');
