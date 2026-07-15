/**
 * Testes unitários — Motor de Unidades Comerciais (MUC) V1.0
 */
const assert = require('assert');
const Muc = require('../../backend/motores/muc');

{
  assert.strictEqual(Muc.paraBase(500, 0.001), 0.5);
  assert.strictEqual(Muc.paraBase(250, 0.001), 0.25);
  assert.strictEqual(Muc.paraBase(2, 1), 2);
  assert.strictEqual(Muc.deBase(0.5, 0.001), 500);
}

{
  const baixa = Muc.resolverBaixaEstoque({
    quantidadeComercial: 20,
    fatorConversao: 12
  });
  assert.strictEqual(baixa.quantidade_base, 240);
}

{
  const v = Muc.validator.validarPayloadUnidade({
    unidade: 'ml',
    fator_conversao: 0.001,
    preco: 1.5
  });
  assert.strictEqual(v.ok, true);
  assert.strictEqual(v.dados.unidade, 'ML');
}

{
  const v = Muc.validator.validarPayloadUnidade({
    unidade: '',
    fator_conversao: 0
  });
  assert.strictEqual(v.ok, false);
}

{
  const payload = Muc.montarPayloadVenda({
    produto: { id: 10, preco_venda: 9.9, codigo_barras: '789' },
    unidade: {
      id: 3,
      unidade: 'ML',
      fator_conversao: 0.001,
      preco: 0.05,
      codigo_barras: '789100'
    },
    quantidadeComercial: 500
  });
  assert.strictEqual(payload.quantidade, 500);
  assert.strictEqual(payload.quantidade_estoque, 0.5);
  assert.strictEqual(payload.unidade_comercial, 'ML');
  assert.strictEqual(payload.preco_unitario, 0.05);
  assert.strictEqual(payload.subtotal, 25);
}

// Exemplo oficial do manual NFC-e SHA implícito: conversão independente
assert.strictEqual(Muc.versao, '1.0.0');

console.log('OK: MUC — conversões, validação e payload de venda.');
