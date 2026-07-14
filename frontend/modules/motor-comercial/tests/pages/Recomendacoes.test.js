/**
 * Recomendações Page Tests — Sprint O-9
 */

const RecomendacoesPage = require('../../pages/Recomendacoes/index');
const { buildViewFromPayload, applyFilters, saveRecomendacaoAction } = require('../../pages/Recomendacoes/recomendacoesMappers');

describe('RecomendacoesPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  test('creates page with dashboard layout', () => {
    const page = RecomendacoesPage.create();
    expect(page.className).toContain('cds-dashboard-layout');
  });

  test('renders main sections', () => {
    const page = RecomendacoesPage.create();
    document.body.appendChild(page);
    expect(document.getElementById('recomendacoes-root')).toBeDefined();
    expect(document.getElementById('rec-kpis')).toBeDefined();
  });
});

describe('recomendacoesMappers', () => {
  beforeEach(() => localStorage.clear());

  test('buildViewFromPayload maps recommendations', () => {
    const view = buildViewFromPayload({
      recomendacoes: [{ id: 'r1', titulo: 'Cobrança', categoria: 'FINANCEIRO', confianca: 80 }],
      kpis: { emitidas: 1 },
      categorias: {}
    });
    expect(view.recomendacoes).toHaveLength(1);
    expect(view.kpis.emitidas).toBe(1);
  });

  test('applyFilters by categoria', () => {
    const view = buildViewFromPayload({
      recomendacoes: [
        { id: '1', categoria: 'CREDITO', titulo: 'A' },
        { id: '2', categoria: 'COMERCIAL', titulo: 'B' }
      ]
    });
    const filtered = applyFilters(view, { categoria: 'CREDITO' });
    expect(filtered.recomendacoes).toHaveLength(1);
  });

  test('saveRecomendacaoAction accepts recommendation', () => {
    saveRecomendacaoAction('accepted', { id: 'r1', titulo: 'Teste' });
    const view = buildViewFromPayload({
      recomendacoes: [{ id: 'r1', titulo: 'Teste', categoria: 'COMERCIAL' }]
    });
    expect(view.recomendacoes[0].status).toBe('ACEITA');
  });
});
