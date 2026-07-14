/**
 * Testes — EntityCard Shared UI (FOUNDATION F3)
 */

const EntityCard = require('./index');

describe('Shared UI — EntityCard', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('#cds-shared-ui-entitycard-styles').forEach((n) => n.remove());
  });

  test('STATUS ready e estados oficiais', () => {
    expect(EntityCard.STATUS).toBe('ready');
    expect(EntityCard.STATES).toEqual(expect.arrayContaining([
      'normal', 'selected', 'disabled', 'loading', 'error'
    ]));
  });

  test('renderiza title, subtitle, status, badges e metadata', () => {
    const el = EntityCard.create({
      title: 'Registro',
      subtitle: 'DOC-1',
      description: 'Extra',
      status: 'Ativo',
      badges: ['A', { text: 'B', variant: 'info' }],
      metadata: [{ label: 'Cidade', value: 'SP' }, 'linha livre']
    });

    expect(el.querySelector('.cds-entity-card__title').textContent).toBe('Registro');
    expect(el.querySelector('.cds-entity-card__subtitle').textContent).toBe('DOC-1');
    expect(el.querySelector('.cds-entity-card__description').textContent).toBe('Extra');
    expect(el.querySelector('.cds-entity-card__status').textContent).toBe('Ativo');
    expect(el.querySelectorAll('.cds-entity-card__badge')).toHaveLength(2);
    expect(el.querySelector('.cds-entity-card__metadata')).toBeTruthy();
  });

  test('ações primary/secondary e eventos', () => {
    const onPrimary = jest.fn();
    const onSecondary = jest.fn();
    const onSelect = jest.fn();

    const el = EntityCard.create({
      title: 'X',
      actions: {
        primary: { label: 'Abrir' },
        secondary: { label: 'Mais' }
      },
      onPrimaryAction: onPrimary,
      onSecondaryAction: onSecondary,
      onSelect
    });

    el.querySelector('.cds-entity-card__action--primary').click();
    el.querySelector('.cds-entity-card__action--secondary').click();
    el.click();

    expect(onPrimary).toHaveBeenCalled();
    expect(onSecondary).toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalled();
  });

  test('estados selected, disabled, loading, error', () => {
    expect(EntityCard.create({ title: 'S', selected: true }).dataset.state).toBe('selected');
    expect(EntityCard.create({ title: 'D', disabled: true }).dataset.state).toBe('disabled');
    expect(EntityCard.create({ title: 'L', loading: true }).dataset.state).toBe('loading');
    const err = EntityCard.create({ title: 'E', error: 'falha' });
    expect(err.dataset.state).toBe('error');
    expect(err.querySelector('[role="alert"]').textContent).toBe('falha');
  });

  test('acessibilidade: foco e teclado no card selecionável', () => {
    const onSelect = jest.fn();
    const el = EntityCard.create({ title: 'Teclado', onSelect });
    document.body.appendChild(el);

    expect(el.getAttribute('role')).toBe('button');
    expect(el.tabIndex).toBe(0);

    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  test('kind é livre (hook CSS) — sem enum de motor', () => {
    const el = EntityCard.create({ title: 'Y', kind: 'qualquer-coisa' });
    expect(el.dataset.kind).toBe('qualquer-coisa');
    const api = EntityCard.create.toString();
    expect(api).not.toMatch(/consignad/i);
    expect(api).not.toMatch(/fornecedor/i);
  });

  test('variantes compact / normal / detailed', () => {
    expect(EntityCard.VARIANTS).toEqual(['compact', 'normal', 'detailed']);
    expect(EntityCard.create({ title: 'C', variant: 'compact' }).dataset.variant).toBe('compact');
    expect(EntityCard.create({ title: 'N' }).dataset.variant).toBe('normal');
    expect(EntityCard.create({ title: 'D', variant: 'detailed' }).dataset.variant).toBe('detailed');
    expect(EntityCard.create({ title: 'L', compact: true }).dataset.variant).toBe('compact');
    expect(EntityCard.create({ title: 'C', variant: 'compact' }).className).toContain('cds-entity-card--compact');
  });

  test('injeta estilos uma vez', () => {
    EntityCard.create({ title: '1' });
    EntityCard.create({ title: '2' });
    expect(document.querySelectorAll('#cds-shared-ui-entitycard-styles')).toHaveLength(1);
  });
});
