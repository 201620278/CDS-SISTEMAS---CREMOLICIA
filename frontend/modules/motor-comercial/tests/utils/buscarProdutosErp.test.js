/**
 * buscarProdutosErp — testes Sprint auditoria comercial
 */

const operacional = require('../../utils/operacional');
const { extrairValorInput } = require('../../utils/formField');

describe('buscarProdutosErp', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function mockFetch(map) {
    global.fetch = jest.fn(async (url) => {
      const handler = map[url] || map.default;
      if (!handler) throw new Error(`Unexpected fetch: ${url}`);
      return handler();
    });
  }

  test('usa consulta PDV para busca por nome', async () => {
    mockFetch({
      default: async () => ({
        ok: true,
        json: async () => ([
          { id: 10, nome: 'Sorvete Chocolate', codigo: 'SC01', preco_venda: 12.5 }
        ])
      })
    });

    const result = await operacional.buscarProdutosErp('sorvete');
    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe('Sorvete Chocolate');
    expect(result[0].preco_venda).toBe(12.5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/produtos/consulta-pdv/buscar?q=sorvete'),
      expect.any(Object)
    );
  });

  test('busca por ID via endpoint individual', async () => {
    mockFetch({
      default: async () => ({
        ok: true,
        json: async () => ({ id: 5, nome: 'Picolé', preco_venda: 3 })
      })
    });

    const result = await operacional.buscarProdutosErp('5');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(5);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/produtos/5'),
      expect.any(Object)
    );
  });

  test('extrairValorInput lê valor do input interno', () => {
    const Input = require('../../components/form/Input');
    const field = Input.create({ id: 'test-input', value: 'abc' });
    expect(extrairValorInput(field)).toBe('abc');
    expect(operacional.extrairValorInput(field)).toBe('abc');
  });
});
