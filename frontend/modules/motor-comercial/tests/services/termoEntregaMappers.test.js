/**
 * Termo de Entrega — testes Sprint S-6.3
 */

const {
  normalizeItensTermo,
  calcularTotaisTermo,
  montarDadosTermo
} = require('../../services/termoEntregaMappers');

describe('termoEntregaMappers', () => {
  test('normalizeItensTermo calcula valor total', () => {
    const itens = normalizeItensTermo([
      { produtoNome: 'Lampada', codigo: '1520', quantidade: 2, precoUnitario: 10 }
    ]);
    expect(itens[0].valorTotal).toBe(20);
    expect(itens[0].produto).toBe('Lampada');
  });

  test('calcularTotaisTermo soma quantidade e valor', () => {
    const { quantidadeTotal, valorTotal } = calcularTotaisTermo([
      { quantidade: 2, preco: 10 },
      { quantidade: 1, preco: 5 }
    ]);
    expect(quantidadeTotal).toBe(3);
    expect(valorTotal).toBe(25);
  });

  test('montarDadosTermo usa observação padrão', () => {
    const dados = montarDadosTermo({
      consignacao: { id: 1, documento: 'CONS-2026-000001', itens: [] },
      cliente: { nome: 'Cliente X', cpf_cnpj: '123' },
      empresa: { nome: 'Cremolicia' },
      usuario: { nome: 'Operador' }
    });
    expect(dados.titulo).toBe('TERMO DE ENTREGA DE CONSIGNAÇÃO');
    expect(dados.observacoes).toBe('Sem observações.');
    expect(dados.documentoOficial).toBe('CONS-2026-000001');
  });
});
