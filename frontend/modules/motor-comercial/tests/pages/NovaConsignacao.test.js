/**
 * NovaConsignacao Page Tests — Sprint UX-04
 */

const NovaConsignacaoPage = require('../../pages/NovaConsignacao/index');
const { normalizeCurrency } = require('../test-helpers');

describe('NovaConsignacaoPage', () => {
  test('creates preparar entrega page with stepper', () => {
    const page = NovaConsignacaoPage.create();
    expect(page).toBeDefined();
    expect(page.className).toContain('cds-page');
    expect(page.querySelector('.cds-stepper')).not.toBeNull();
    expect(page.textContent).toContain('Preparar Entrega');
    expect(page.textContent).not.toContain('Nova Consignação');
  });

  test('initializes four operational moments', () => {
    const wizard = new NovaConsignacaoPage();
    expect(wizard.steps).toHaveLength(4);
    expect(wizard.steps.map((s) => s.label)).toEqual(['Cliente', 'Produtos', 'Conferência', 'Conclusão']);
    expect(wizard.currentStep).toBe(0);
  });

  test('contexto cliente360 pula para produtos', () => {
    const wizard = new NovaConsignacaoPage({}, { clienteId: '12', origem: 'cliente360' });
    expect(wizard.skipClienteStep).toBe(true);
    expect(wizard.clienteLocked).toBe(true);
    expect(wizard.currentStep).toBe(1);
    expect(wizard.steps[0].state).toBe('completed');
    expect(wizard.steps[1].state).toBe('current');
  });

  test('contexto central pula para produtos', () => {
    const wizard = new NovaConsignacaoPage({}, { clienteId: '8', origem: 'central' });
    expect(wizard.skipClienteStep).toBe(true);
    expect(wizard.currentStep).toBe(1);
  });

  test('fluxo menu inicia em cliente', () => {
    const wizard = new NovaConsignacaoPage({}, {});
    expect(wizard.skipClienteStep).toBe(false);
    expect(wizard.currentStep).toBe(0);
  });

  test('contexto cliente360 oculta voltar na etapa produtos', () => {
    const wizard = new NovaConsignacaoPage({}, { clienteId: '12', origem: 'cliente360' });
    const footer = wizard._createFooter();
    const texts = Array.from(footer.querySelectorAll('button')).map((b) => b.textContent);
    expect(texts).not.toContain('Voltar');
    expect(texts).toContain('Continuar');
  });

  test('conferência exibe botão Concluir', () => {
    const wizard = new NovaConsignacaoPage();
    wizard.currentStep = 2;
    const footer = wizard._createFooter();
    const texts = Array.from(footer.querySelectorAll('button')).map((b) => b.textContent);
    expect(texts).toContain('Concluir');
    expect(texts).not.toContain('Continuar');
  });

  test('validates produtos step requires items', () => {
    const wizard = new NovaConsignacaoPage();
    wizard.currentStep = 1;
    wizard.data.itens = [];
    const errors = wizard._validateCurrentStep();
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toBe('Adicione pelo menos um produto');
  });

  test('formats currency correctly', () => {
    const wizard = new NovaConsignacaoPage();
    expect(normalizeCurrency(wizard._formatCurrency(1000.50))).toBe('R$ 1.000,50');
  });
});
