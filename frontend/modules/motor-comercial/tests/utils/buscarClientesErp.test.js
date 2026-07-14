/**
 * buscarClientesErp — Sprint S-5.1
 */

const operacional = require('../../utils/operacional');

describe('buscarClientesErp', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function mockFetch(handler) {
    global.fetch = jest.fn(handler);
  }

  test('busca por ID usa endpoint /clientes/:id', async () => {
    mockFetch((url) => {
      if (String(url).includes('/clientes/15')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 15, nome: 'Cliente ID', cpf_cnpj: '123', telefone: '85999999999' })
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const result = await operacional.buscarClientesErp('15');
    expect(result).toHaveLength(1);
    expect(result[0].nome).toBe('Cliente ID');
  });

  test('busca textual usa /clientes/buscar', async () => {
    mockFetch((url) => {
      if (String(url).includes('/clientes/buscar?termo=maria')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 2, nome: 'Maria Silva', cpf_cnpj: '111', telefone: '85888888888' }]
        });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    const result = await operacional.buscarClientesErp('maria');
    expect(result[0].nome).toBe('Maria Silva');
  });

  test('fallback local filtra telefone', async () => {
    mockFetch((url) => {
      if (String(url).includes('/clientes/buscar')) {
        return Promise.reject(new Error('offline'));
      }
      if (String(url).endsWith('/clientes')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 3, nome: 'João', cpf_cnpj: '222', telefone: '(85) 98765-4321' }
          ]
        });
      }
      return Promise.resolve({ ok: true, json: async () => null });
    });

    const result = await operacional.buscarClientesErp('987654321');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(3);
  });
});
