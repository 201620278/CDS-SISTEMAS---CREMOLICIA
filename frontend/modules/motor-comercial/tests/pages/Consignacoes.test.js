/**
 * Consignacoes Page Tests — Sprint H-2
 */

const ConsignacoesPage = require('../../pages/Consignacoes/index');
const { normalizeCurrency } = require('../test-helpers');

describe('ConsignacoesPage', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('creates consignacoes page', () => {
    const page = ConsignacoesPage.create();
    expect(page).toBeDefined();
    expect(page.className).toContain('cds-dashboard-layout');
  });

  test('renders cockpit header title', () => {
    const page = ConsignacoesPage.create();
    container.appendChild(page);
    const title = page.querySelector('.cds-cockpit-header__title');
    expect(title.textContent).toBe('Consignações');
  });

  test('formats currency correctly', () => {
    const page = new ConsignacoesPage();
    expect(normalizeCurrency(page._formatCurrency(1000.50))).toBe('R$ 1.000,50');
  });

  test('initializes with loading true', () => {
    const page = new ConsignacoesPage();
    expect(page.loading).toBe(true);
  });
});
