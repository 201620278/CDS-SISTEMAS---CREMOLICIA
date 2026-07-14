/**
 * CDSIconButton — Botão apenas com ícone
 *
 * @module frontend/shared/design-system/components/buttons/CDSIconButton
 */

const CDSButton = require('./CDSButton');

class CDSIconButton {
  static create(options = {}) {
    const { icon, text = '', ariaLabel, ...rest } = options;
    const button = CDSButton.create({
      ...rest,
      text: text || ariaLabel || '',
      icon,
      variant: rest.variant || 'ghost',
      size: rest.size || 'sm'
    });
    if (ariaLabel) button.setAttribute('aria-label', ariaLabel);
    button.classList.add('cds-icon-button');
    return button;
  }

  static getStyles() {
    return `${CDSButton.getStyles()}
      .cds-icon-button .button-text:empty { display: none; }
      .cds-icon-button { min-width: 36px; padding: var(--spacing-sm, 8px); }
    `;
  }
}

module.exports = CDSIconButton;
