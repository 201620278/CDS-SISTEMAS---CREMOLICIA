/**
 * Central de Pendências Page Tests — Sprint O-8
 *
 * @module frontend/modules/motor-comercial/tests/pages/Pendencias.test
 */

const PendenciasPage = require('../../pages/Pendencias/index');
const {
  buildViewFromPayload,
  applyFilters,
  savePendenciaAction,
  loadHistory
} = require('../../pages/Pendencias/pendenciasMappers');

describe('PendenciasPage', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    localStorage.clear();
  });

  afterEach(() => {
    document.body.removeChild(container);
    localStorage.clear();
  });

  test('creates pendencias page with dashboard layout', () => {
    const page = PendenciasPage.create();
    expect(page).toBeDefined();
    expect(page.className).toContain('cds-dashboard-layout');
  });

  test('renders main sections', () => {
    const page = PendenciasPage.create();
    container.appendChild(page);
    expect(document.getElementById('pendencias-root')).toBeDefined();
    expect(document.getElementById('pendencias-resumo')).toBeDefined();
    expect(document.getElementById('pendencias-proximas')).toBeDefined();
    expect(document.getElementById('pendencias-criticas')).toBeDefined();
    expect(document.getElementById('pendencias-historico')).toBeDefined();
  });
});

describe('pendenciasMappers', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  test('buildViewFromPayload maps API payload', () => {
    const view = buildViewFromPayload({
      resumo: { total: 2, criticos: 1 },
      alertas: [
        { id: 'a1', categoria: 'COMERCIAL', severidade: 'CRITICAL', descricao: 'Teste' }
      ],
      criticas: [{ id: 'a1', descricao: 'Teste' }],
      importantes: [],
      informativas: [],
      proximasAcoes: [{ id: 'a1', titulo: 'Teste', acao: 'Agir' }]
    });
    expect(view.alertas).toHaveLength(1);
    expect(view.criticas).toHaveLength(1);
    expect(view.resumo.pendentes).toBe(1);
  });

  test('applyFilters filters by categoria', () => {
    const view = buildViewFromPayload({
      alertas: [
        { id: '1', categoria: 'FINANCEIRO', descricao: 'F' },
        { id: '2', categoria: 'COMERCIAL', descricao: 'C' }
      ],
      criticas: [],
      importantes: [],
      informativas: []
    });
    const filtered = applyFilters(view, { categoria: 'FINANCEIRO' });
    expect(filtered.alertas).toHaveLength(1);
    expect(filtered.alertas[0].categoria).toBe('FINANCEIRO');
  });

  test('savePendenciaAction resolves and records history', () => {
    savePendenciaAction('resolved', { id: 'x1', descricao: 'Alerta X' }, { responsavel: 'Teste' });
    const history = loadHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].alerta).toBe('Alerta X');
  });
});
