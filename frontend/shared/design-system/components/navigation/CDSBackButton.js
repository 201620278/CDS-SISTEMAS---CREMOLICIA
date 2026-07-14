/**
 * CDSBackButton — Botão de retorno oficial
 *
 * @module frontend/shared/design-system/components/navigation/CDSBackButton
 */

const theme = require('../../theme');

class CDSBackButton {
  static create(options = {}) {
    const { label = 'Voltar', onClick = null } = options;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cds-back-button';
    btn.innerHTML = `<span aria-hidden="true">←</span> ${label}`;
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-back-button {
        display: inline-flex; align-items: center; gap: ${t.spacing.xs};
        padding: ${t.spacing.xs} ${t.spacing.sm}; border: none; background: transparent;
        color: ${t.colors.primary[600]}; font-size: ${t.typography.fontSize.sm};
        cursor: pointer; border-radius: ${t.radius.md};
      }
      .cds-back-button:hover { background: ${t.colors.primary[50]}; }
    `;
  }
}

module.exports = CDSBackButton;
