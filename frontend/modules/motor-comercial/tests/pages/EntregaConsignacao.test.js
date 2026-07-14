/**
 * EntregaConsignacao Page Tests — Sprint H-2
 */

const EntregaConsignacaoPage = require('../../pages/EntregaConsignacao/index');
const { normalizeCurrency } = require('../test-helpers');

describe('EntregaConsignacaoPage', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('creates entrega consignacao page', () => {
    const page = EntregaConsignacaoPage.create('123');
    expect(page).toBeDefined();
    expect(page.className).toContain('cds-workspace');
    expect(page.dataset.sharedUiReference).toBe('entrega');
  });

  test('initializes with consignacaoId', () => {
    const page = new EntregaConsignacaoPage('123');
    expect(page.consignacaoId).toBe('123');
  });

  test('updates checklist based on consignation data', () => {
    const page = new EntregaConsignacaoPage('123');
    page.consignacao = {
      clienteId: 1,
      perfilStatus: 'ATIVO',
      documento: 'DOC-123',
      itens: [{ produto: 'Test', quantidade: 1, preco: 10 }],
      status: 'RASCUNHO',
      limite: 1000
    };
    page.resumoPrestacao = { saldoAtual: 0 };
    page._updateChecklist();
    expect(page.checklist.clienteValido).toBe(true);
    expect(page.checklist.perfilAtivo).toBe(true);
    expect(page.checklist.documentoValido).toBe(true);
    expect(page.checklist.itensCadastrados).toBe(true);
  });

  test('formats currency correctly', () => {
    const page = new EntregaConsignacaoPage('123');
    expect(normalizeCurrency(page._formatCurrency(1000.50))).toBe('R$ 1.000,50');
  });

  test('_verificarEntregaJaPersistida reconhece status ENTREGUE após erro HTTP', async () => {
    const page = new EntregaConsignacaoPage('123');
    page.api.obterConsignacao = jest.fn(async () => ({ id: 123, status: 'ENTREGUE', itens: [] }));

    await expect(page._verificarEntregaJaPersistida()).resolves.toBe(true);
    expect(page.consignacao.status).toBe('ENTREGUE');
  });

  test('_verificarEntregaJaPersistida retorna false quando ainda não entregue', async () => {
    const page = new EntregaConsignacaoPage('123');
    page.api.obterConsignacao = jest.fn(async () => ({ id: 123, status: 'RASCUNHO' }));

    await expect(page._verificarEntregaJaPersistida()).resolves.toBe(false);
  });
});
