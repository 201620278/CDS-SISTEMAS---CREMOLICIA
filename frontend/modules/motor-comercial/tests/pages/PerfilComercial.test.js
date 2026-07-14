/**
 * PerfilComercial Page Tests — Sprint H-2
 */

const PerfilComercialPage = require('../../pages/PerfilComercial/index');
const { mapPerfilListItem } = require('../../pages/PerfilComercial/perfilMappers');
const { normalizeCurrency } = require('../test-helpers');

describe('PerfilComercialPage', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('creates perfil comercial page in list mode', () => {
    const page = PerfilComercialPage.create();
    expect(page).toBeDefined();
    expect(page.className).toContain('cds-cadastro-layout');
  });

  test('renders list header title', () => {
    const page = PerfilComercialPage.create();
    container.appendChild(page);
    const title = page.querySelector('h1');
    expect(title.textContent).toContain('CENTRAL DE CLIENTES');
  });

  test('initializes list mode by default', () => {
    const page = new PerfilComercialPage();
    expect(page.mode).toBe('list');
    expect(page.perfis).toEqual([]);
  });

  test('formats currency correctly', () => {
    const page = new PerfilComercialPage();
    expect(normalizeCurrency(page._formatCurrency(1000.50))).toBe('R$ 1.000,50');
  });

  test('mapPerfilListItem uses cliente mestre nested object', () => {
    const item = mapPerfilListItem({
      id: 1,
      clienteId: 10,
      perfilTipo: 'CONSIGNADO',
      limiteComercial: 1000,
      cliente: { nome: 'João Silva', documento: '12345678900', telefone: '85999999999' }
    });
    expect(item.cliente).toBe('João Silva');
    expect(item.clienteNome).toBe('João Silva');
    expect(item.cpfCnpj).toBe('12345678900');
    expect(item.telefone).toBe('85999999999');
  });
});
