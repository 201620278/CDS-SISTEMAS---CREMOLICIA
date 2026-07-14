/**
 * Playbooks Page Tests — Sprint O-10
 */

const PlaybooksPage = require('../../pages/Playbooks/index');
const {
  buildViewFromPayload,
  applyFilters,
  startPlaybook,
  updateChecklistItem
} = require('../../pages/Playbooks/playbooksMappers');

describe('PlaybooksPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  test('creates page with dashboard layout', () => {
    const page = PlaybooksPage.create();
    expect(page.className).toContain('cds-dashboard-layout');
  });

  test('renders main sections', () => {
    const page = PlaybooksPage.create();
    document.body.appendChild(page);
    expect(document.getElementById('playbooks-root')).toBeDefined();
    expect(document.getElementById('pb-kpis')).toBeDefined();
    expect(document.getElementById('pb-lista')).toBeDefined();
  });
});

describe('playbooksMappers', () => {
  beforeEach(() => localStorage.clear());

  test('buildViewFromPayload maps playbooks catalog', () => {
    const view = buildViewFromPayload({
      playbooks: [{ id: 'PB-001', codigo: '001', nome: 'Cobrar Cliente', categoria: 'COBRANCA', passos: [{ id: 's1', titulo: 'Passo 1' }] }],
      sugeridos: [],
      kpis: { catalogoTotal: 1 }
    });
    expect(view.playbooks).toHaveLength(1);
    expect(view.kpis.catalogoTotal).toBe(1);
  });

  test('applyFilters by categoria', () => {
    const view = buildViewFromPayload({
      playbooks: [
        { id: 'PB-001', nome: 'A', categoria: 'COBRANCA', passos: [] },
        { id: 'PB-002', nome: 'B', categoria: 'RECUPERACAO', passos: [] }
      ]
    });
    const filtered = applyFilters(view, { categoria: 'COBRANCA' });
    expect(filtered.playbooks).toHaveLength(1);
  });

  test('startPlaybook creates instance without auto execution', () => {
    const playbook = {
      id: 'PB-001',
      nome: 'Cobrar Cliente',
      passos: [{ id: 's1', titulo: 'Passo 1' }, { id: 's2', titulo: 'Passo 2' }]
    };
    const instance = startPlaybook(playbook);
    expect(instance.status).toBe('EM_ANDAMENTO');
    expect(instance.checklist[0].status).toBe('EM_ANDAMENTO');
    expect(instance.checklist[1].status).toBe('PENDENTE');
  });

  test('updateChecklistItem advances flow on completion', () => {
    const playbook = {
      id: 'PB-001',
      nome: 'Cobrar Cliente',
      passos: [{ id: 's1', titulo: 'Passo 1' }, { id: 's2', titulo: 'Passo 2' }]
    };
    startPlaybook(playbook);
    const updated = updateChecklistItem('PB-001', 's1', 'CONCLUIDO');
    expect(updated.passoAtual).toBe(1);
    expect(updated.checklist[1].status).toBe('EM_ANDAMENTO');
  });
});
