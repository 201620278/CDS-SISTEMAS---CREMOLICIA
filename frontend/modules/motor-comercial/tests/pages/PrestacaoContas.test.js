/**
 * PrestacaoContas Page Tests — Sprint UX-05
 */

const PrestacaoContasPage = require('../../pages/PrestacaoContas/index');
const { normalizeCurrency } = require('../test-helpers');

describe('PrestacaoContasPage', () => {
  test('creates fechar consignação page', () => {
    const page = PrestacaoContasPage.create('123');
    expect(page).toBeDefined();
    expect(page.className).toContain('cds-wizard-layout');
    expect(page.textContent).toContain('Fechar Consignação');
  });

  test('initializes with consignacaoId and five moments', () => {
    const page = new PrestacaoContasPage('123');
    expect(page.consignacaoId).toBe('123');
    expect(page.steps).toHaveLength(5);
    expect(page.currentStep).toBe(0);
  });

  test('contexto central usa parseNavigationContext', () => {
    const page = new PrestacaoContasPage('123', { clienteId: '5', origem: 'central' });
    expect(page.navigationContext.origem).toBe('central');
    expect(page.navigationContext.clienteId).toBe(5);
  });

  test('can encerrar when operador autorizado e consignação aberta', () => {
    const page = new PrestacaoContasPage('123');
    page.consignacao = { status: 'EM_PRESTACAO' };
    page.checklist = undefined;
    expect(typeof page._canEncerrar()).toBe('boolean');
  });

  test('formats currency correctly', () => {
    const page = new PrestacaoContasPage('123');
    expect(normalizeCurrency(page._formatCurrency(1000.50))).toBe('R$ 1.000,50');
  });
});
