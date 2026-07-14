/**
 * Workflow Center Page Tests — Sprint O-11
 */

const WorkflowCenterPage = require('../../pages/WorkflowCenter/index');
const {
  buildViewFromPayload,
  applyFilters,
  updateWorkflowStatus,
  buildWorkflowId,
  colunaLabel,
  slaVariant
} = require('../../pages/WorkflowCenter/workflowMappers');

describe('WorkflowCenterPage', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  afterEach(() => localStorage.clear());

  test('creates page with dashboard layout', () => {
    const page = WorkflowCenterPage.create();
    expect(page.className).toContain('cds-dashboard-layout');
  });

  test('renders main sections', () => {
    const page = WorkflowCenterPage.create();
    document.body.appendChild(page);
    expect(document.getElementById('workflow-root')).toBeDefined();
    expect(document.getElementById('wf-resumo')).toBeDefined();
    expect(document.getElementById('wf-kanban')).toBeDefined();
    expect(document.getElementById('wf-sla')).toBeDefined();
    expect(document.getElementById('wf-fila')).toBeDefined();
  });
});

describe('workflowMappers', () => {
  beforeEach(() => localStorage.clear());

  test('buildViewFromPayload maps workflows and kanban', () => {
    const view = buildViewFromPayload({
      resumo: { workflowsAtivos: 2 },
      workflows: [
        { id: 'WF-1', titulo: 'Cobrança', coluna: 'novo', prioridade: 'HIGH', sla: { status: 'DENTRO', indicador: 'verde' } },
        { id: 'WF-2', titulo: 'Entrega', coluna: 'emAndamento', prioridade: 'NORMAL', sla: { status: 'VENCIDO', indicador: 'vermelho' } }
      ],
      sla: { dentroPrazo: 1, vencido: 1 },
      distribuicao: [],
      timeline: []
    });
    expect(view.workflows).toHaveLength(2);
    expect(view.kanban.novo).toHaveLength(1);
    expect(view.kanban.emAndamento).toHaveLength(1);
  });

  test('applyFilters by status coluna', () => {
    const view = buildViewFromPayload({
      workflows: [
        { id: 'WF-1', titulo: 'A', coluna: 'novo', prioridade: 'HIGH' },
        { id: 'WF-2', titulo: 'B', coluna: 'bloqueado', prioridade: 'NORMAL' }
      ]
    });
    const filtered = applyFilters(view, { status: 'bloqueado' });
    expect(filtered.workflows).toHaveLength(1);
    expect(filtered.workflows[0].id).toBe('WF-2');
  });

  test('updateWorkflowStatus marks concluido', () => {
    updateWorkflowStatus('WF-99', 'concluido', 'CONCLUIDO');
    const view = buildViewFromPayload({
      workflows: [{ id: 'WF-99', titulo: 'Teste', coluna: 'novo', prioridade: 'NORMAL' }]
    });
    expect(view.workflows[0].coluna).toBe('concluido');
  });

  test('buildWorkflowId is deterministic', () => {
    const id = buildWorkflowId('PEND', 'alert-1', 10, 20);
    expect(id).toMatch(/^WF-/);
    expect(buildWorkflowId('PEND', 'alert-1', 10, 20)).toBe(id);
  });

  test('colunaLabel and slaVariant helpers', () => {
    expect(colunaLabel('emAndamento')).toBe('Em andamento');
    expect(slaVariant('vermelho')).toBe('error');
    expect(slaVariant('verde')).toBe('success');
  });
});
