/**
 * Testes — SmartSearch Shared UI (FOUNDATION F3)
 */

const SmartSearch = require('./index');

describe('Shared UI — SmartSearch', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('#cds-shared-ui-smartsearch-styles, #cds-shared-ui-entitycard-styles, #cds-shared-ui-live')
      .forEach((n) => n.remove());
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('STATUS ready e API pública', () => {
    expect(SmartSearch.STATUS).toBe('ready');
    expect(typeof SmartSearch.create).toBe('function');
    expect(SmartSearch.STATES).toEqual(expect.arrayContaining([
      'idle', 'searching', 'loading', 'results', 'empty', 'error', 'disabled'
    ]));
  });

  test('pesquisa incremental com debounce', async () => {
    const provider = jest.fn(async (q) => ([{ id: 1, title: `Hit ${q}` }]));
    const el = SmartSearch.create({
      debounce: 200,
      minChars: 1,
      useEntityCard: false,
      provider
    });
    document.body.appendChild(el);

    const input = el.querySelector('.cds-smartsearch__input');
    input.value = 'ab';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(provider).not.toHaveBeenCalled();
    expect(el.cdsSmartSearch.getState()).toBe('searching');

    jest.advanceTimersByTime(199);
    expect(provider).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    await Promise.resolve();
    await Promise.resolve();

    expect(provider).toHaveBeenCalledWith('ab', expect.objectContaining({ keys: [] }));
    expect(el.cdsSmartSearch.getState()).toBe('results');
  });

  test('estados: empty, results, error, disabled', async () => {
    jest.useRealTimers();

    const emptyEl = SmartSearch.create({
      debounce: 0,
      useEntityCard: false,
      provider: async () => []
    });
    document.body.appendChild(emptyEl);
    await emptyEl.cdsSmartSearch.searchNow('xyz');
    expect(emptyEl.cdsSmartSearch.getState()).toBe('empty');

    const okEl = SmartSearch.create({
      debounce: 0,
      useEntityCard: false,
      provider: async () => ([{ id: '1', title: 'A' }])
    });
    document.body.appendChild(okEl);
    await okEl.cdsSmartSearch.searchNow('a');
    expect(okEl.dataset.state).toBe('results');
    expect(okEl.cdsSmartSearch.getItems()).toHaveLength(1);

    const errEl = SmartSearch.create({
      debounce: 0,
      useEntityCard: false,
      provider: async () => { throw new Error('falhou'); }
    });
    document.body.appendChild(errEl);
    await errEl.cdsSmartSearch.searchNow('a');
    expect(errEl.cdsSmartSearch.getState()).toBe('error');

    const dis = SmartSearch.create({ disabled: true, provider: async () => [] });
    expect(dis.cdsSmartSearch.getState()).toBe('disabled');
  });

  test('Enter seleciona item ativo; Esc limpa', async () => {
    jest.useRealTimers();
    const onSelect = jest.fn();
    const onClear = jest.fn();
    const el = SmartSearch.create({
      debounce: 0,
      useEntityCard: false,
      provider: async () => ([{ id: '9', title: 'Nove' }, { id: '8', title: 'Oito' }]),
      onSelect,
      onClear
    });
    document.body.appendChild(el);
    await el.cdsSmartSearch.searchNow('n');
    expect(el.cdsSmartSearch.getState()).toBe('results');

    const input = el.cdsSmartSearch.input;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: '9', title: 'Nove' }),
      expect.any(Object)
    );

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onClear).toHaveBeenCalled();
    expect(el.cdsSmartSearch.getQuery()).toBe('');
    expect(el.cdsSmartSearch.getState()).toBe('idle');
  });

  test('setas navegam entre resultados', async () => {
    jest.useRealTimers();
    const el = SmartSearch.create({
      debounce: 0,
      useEntityCard: false,
      provider: async () => ([
        { id: '1', title: 'Um' },
        { id: '2', title: 'Dois' },
        { id: '3', title: 'Três' }
      ])
    });
    document.body.appendChild(el);
    await el.cdsSmartSearch.searchNow('x');
    expect(el.querySelectorAll('[role="option"]').length).toBe(3);

    const input = el.cdsSmartSearch.input;
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    const options = el.querySelectorAll('[role="option"]');
    expect(options[1].getAttribute('aria-selected')).toBe('true');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(options[0].getAttribute('aria-selected')).toBe('true');
  });

  test('Ctrl+F foca o SmartSearch', () => {
    const el = SmartSearch.create({
      shortcuts: { focus: true },
      useEntityCard: false,
      provider: async () => []
    });
    document.body.appendChild(el);
    const input = el.cdsSmartSearch.input;
    const spy = jest.spyOn(input, 'focus');

    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'f',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    }));

    expect(spy).toHaveBeenCalled();
    el.cdsSmartSearch.destroy();
  });

  test('encaminha filters e keys ao provider', async () => {
    jest.useRealTimers();
    const provider = jest.fn(async () => []);
    const el = SmartSearch.create({
      debounce: 0,
      useEntityCard: false,
      filters: { ativo: true },
      keys: ['barcode', 'codigo'],
      provider
    });
    await el.cdsSmartSearch.searchNow('789');
    expect(provider).toHaveBeenCalledWith(
      '789',
      expect.objectContaining({ filters: { ativo: true }, keys: ['barcode', 'codigo'] })
    );
  });

  test('acessibilidade combobox / listbox', async () => {
    jest.useRealTimers();
    const el = SmartSearch.create({
      debounce: 0,
      useEntityCard: false,
      provider: async () => ([{ id: 1, title: 'A' }])
    });
    document.body.appendChild(el);
    const input = el.cdsSmartSearch.input;
    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    await el.cdsSmartSearch.searchNow('a');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('[role="listbox"]')).toBeTruthy();
    expect(el.querySelector('[role="option"]')).toBeTruthy();
  });

  test('renderiza resultados com EntityCard quando habilitado', async () => {
    jest.useRealTimers();
    const el = SmartSearch.create({
      debounce: 0,
      useEntityCard: true,
      provider: async () => ([{ id: '1', title: 'Entidade', subtitle: 'DOC' }])
    });
    document.body.appendChild(el);
    await el.cdsSmartSearch.searchNow('ent');
    expect(el.cdsSmartSearch.getState()).toBe('results');
    expect(el.querySelector('.cds-entity-card')).toBeTruthy();
    expect(el.querySelector('.cds-entity-card').getAttribute('role')).toBe('option');
  });

  test('não contém termos de domínio Comercial na API exportada', () => {
    const src = SmartSearch.create.toString() + JSON.stringify(Object.keys(SmartSearch));
    expect(src).not.toMatch(/consignad/i);
    expect(src).not.toMatch(/MotorComercial/);
  });
});
