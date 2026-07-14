/**
 * Dashboard Page Tests — Sprint UX-03 / UX-21
 */

const DashboardPage = require('../../pages/Dashboard/index');
const { normalizeCurrency } = require('../test-helpers');

describe('DashboardPage', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('creates dashboard page as Workspace central', () => {
    const dashboard = DashboardPage.create();
    expect(dashboard).toBeDefined();
    expect(dashboard.className).toContain('cds-central-trabalho-host');
    expect(dashboard.id).toBe('central-trabalho-root');
  });

  test('renders central de trabalho root', () => {
    const dashboard = DashboardPage.create();
    container.appendChild(dashboard);
    const root = container.querySelector('#central-trabalho-root');
    expect(root).toBeDefined();
  });

  test('formats currency correctly', () => {
    const dashboard = new DashboardPage();
    expect(normalizeCurrency(dashboard._formatCurrency(1000.50))).toBe('R$ 1.000,50');
  });
});
