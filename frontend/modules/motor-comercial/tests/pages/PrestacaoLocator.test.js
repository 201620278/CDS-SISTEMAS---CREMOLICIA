/**
 * PrestacaoLocator — UX-12
 */

jest.mock('../../api/MotorComercialApi', () => jest.fn().mockImplementation(() => ({
  listarConsignacoes: jest.fn(async () => ({ items: [] }))
})));

jest.mock('../../api/ProjectionApi', () => jest.fn().mockImplementation(() => ({
  obterSituacaoCliente: jest.fn(async () => ({}))
})));

jest.mock('../../utils/operacional', () => ({
  buscarClientesErp: jest.fn(async () => []),
  navigate: jest.fn(),
  notify: jest.fn()
}));

const PrestacaoLocatorPage = require('../../pages/PrestacaoLocator');
const {
  buildLocatorResult,
  escolherConsignacaoElegivel
} = require('../../pages/PrestacaoLocator/locatorMappers');

describe('PrestacaoLocator — UX-12', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('#cds-shared-ui-workspace-styles, #cds-shared-ui-smartsearch-styles, #cds-shared-ui-entitycard-styles')
      .forEach((n) => n.remove());
  });

  test('monta Workspace + SmartSearch oficiais', () => {
    const el = PrestacaoLocatorPage.create({}, { origem: 'central' });
    expect(el.classList.contains('cds-workspace')).toBe(true);
    expect(el.dataset.uxSprint).toBe('UX-20');
    expect(el.dataset.sharedUiReference).toBe('prestacao-locator');
    expect(el.querySelector('.cds-workspace__header')).toBeTruthy();
    expect(el.querySelector('.cds-workspace__body--scroll')).toBeTruthy();
    expect(el.querySelector('.cds-workspace__footer')).toBeTruthy();
    expect(el.querySelector('.cds-smartsearch')).toBeTruthy();
    expect(el.querySelector('.cds-workspace__title').textContent).toBe('Prestação de Contas');
  });

  test('escolherConsignacaoElegivel prioriza EM_PRESTACAO', () => {
    const chosen = escolherConsignacaoElegivel([
      { id: 1, status: 'ENTREGUE' },
      { id: 2, status: 'EM_PRESTACAO' },
      { id: 3, status: 'RASCUNHO' }
    ]);
    expect(chosen.id).toBe(2);
  });

  test('buildLocatorResult expõe só campos operacionais do card', () => {
    const item = buildLocatorResult({
      cliente: {
        id: 9,
        nome: 'Maria',
        cpf_cnpj: '123',
        telefone: '8499999',
        cidade: 'Natal',
        uf: 'RN'
      },
      consignacao: {
        id: 55,
        status: 'ENTREGUE',
        saldo: 120,
        updatedAt: '2026-07-01T12:00:00Z'
      }
    });

    expect(item.title).toBe('Maria');
    expect(item.subtitle).toBe('123');
    expect(item.metadata.map((m) => m.label)).toEqual([
      'Telefone', 'Cidade', 'Saldo em aberto', 'Última movimentação'
    ]);
    expect(item.data.consignacaoId).toBe(55);
  });
});
