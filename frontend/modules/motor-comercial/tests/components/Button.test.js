/**
 * Button Component Tests
 *
 * Sprint 2.7: Arquitetura Frontend — testes do Button.
 *
 * @module frontend/modules/motor-comercial/tests/components
 */

const Button = require('../../components/base/Button');

describe('Button', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  test('creates button with text', () => {
    const button = Button.create({ text: 'Salvar' });
    container.appendChild(button);
    expect(button.textContent).toContain('Salvar');
  });

  test('applies variant class', () => {
    const button = Button.create({ text: 'Salvar', variant: 'primary' });
    container.appendChild(button);
    expect(button.className).toContain('cds-button--primary');
  });

  test('applies size class', () => {
    const button = Button.create({ text: 'Salvar', size: 'lg' });
    container.appendChild(button);
    expect(button.className).toContain('cds-button--lg');
  });

  test('disables button when disabled', () => {
    const button = Button.create({ text: 'Salvar', disabled: true });
    container.appendChild(button);
    expect(button.disabled).toBe(true);
  });

  test('calls onClick handler', () => {
    const onClick = jest.fn();
    const button = Button.create({ text: 'Salvar', onClick });
    container.appendChild(button);
    button.click();
    expect(onClick).toHaveBeenCalled();
  });
});
