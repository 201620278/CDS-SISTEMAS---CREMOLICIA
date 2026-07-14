/**
 * Conta Corrente — UX-11 Workspace (primeira tela oficial Shared UI)
 */

jest.mock('../../api/MotorComercialApi', () => jest.fn().mockImplementation(() => ({
  obterConsignacao: jest.fn(async () => ({}))
})));

jest.mock('../../api/ProjectionApi', () => jest.fn().mockImplementation(() => ({
  listarMovimentacoes: jest.fn(async () => ({ movimentacoes: [] })),
  obterProjecaoSaldos: jest.fn(async () => ({})),
  obterProjecaoIndicadores: jest.fn(async () => ({})),
  obterProjecaoDashboard: jest.fn(async () => ({})),
  obterProjecaoInsights: jest.fn(async () => ({})),
  listarTimeline: jest.fn(async () => ([])),
  obterProjecaoContaCorrente: jest.fn(async () => ({})),
  obterSituacaoCliente: jest.fn(async () => ({}))
})));

const ContaCorrentePage = require('../../pages/ContaCorrente/index');

describe('ContaCorrentePage — UX-11 Workspace', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('#cds-shared-ui-workspace-styles, #cds-conta-corrente-ux11-styles')
      .forEach((n) => n.remove());
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('monta Workspace oficial (Header + Body scroll + Footer)', () => {
    const el = ContaCorrentePage.create({}, { clienteId: '10', clienteNome: 'Cliente Teste' });

    expect(el.classList.contains('cds-workspace')).toBe(true);
    expect(el.dataset.uxSprint).toBe('UX-20');
    expect(el.dataset.sharedUiReference).toBe('conta-corrente');
    expect(el.querySelector('.cds-workspace__header')).toBeTruthy();
    expect(el.querySelector('.cds-workspace__body--scroll')).toBeTruthy();
    expect(el.querySelector('.cds-workspace__footer')).toBeTruthy();
  });

  test('viewport operacional: extrato + Receber; Análise recolhida', () => {
    const el = ContaCorrentePage.create({}, { clienteId: '10', clienteNome: 'Cliente Teste' });

    expect(el.querySelector('#extrato-cliente').textContent).toContain('Cliente Teste');
    expect(el.querySelector('#extrato-saldo')).toBeTruthy();
    expect(el.querySelector('#extrato-tabela')).toBeTruthy();
    expect(el.querySelector('#extrato-btn-receber')).toBeTruthy();
    expect(el.querySelector('#extrato-analise')).toBeTruthy();
    expect(el.querySelector('#extrato-analise').open).toBe(false);
  });

  test('header exibe cliente, documento, período e saldo', () => {
    const el = ContaCorrentePage.create({}, {
      clienteId: '10',
      clienteNome: 'Ada',
      documento: 'DOC-1'
    });

    expect(el.querySelector('#extrato-cliente').textContent).toBe('Ada');
    expect(el.querySelector('#extrato-documento').textContent).toBe('DOC-1');
    expect(el.querySelector('#extrato-periodo')).toBeTruthy();
    expect(el.querySelector('#extrato-saldo')).toBeTruthy();
  });

  test('não usa DashboardLayout legado', () => {
    const el = ContaCorrentePage.create({}, { clienteId: '10' });
    expect(el.className).not.toMatch(/dashboard-layout/i);
    expect(el.querySelector('.cds-extrato-sidebar')).toBeNull();
    expect(el.querySelector('#extrato-resumo')?.closest('details')).toBeTruthy();
  });
});
