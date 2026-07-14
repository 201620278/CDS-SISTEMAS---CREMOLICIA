/**
 * CDSFooter — Rodapé de página oficial
 *
 * @module frontend/shared/design-system/components/layouts/CDSFooter
 */

const theme = require('../../theme');

class CDSFooter {
  static create(options = {}) {
    const { left = '', right = '' } = options;
    const footer = document.createElement('footer');
    footer.className = 'cds-footer';
    footer.innerHTML = `<span class="cds-footer__left">${left}</span><span class="cds-footer__right">${right}</span>`;
    return footer;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-footer {
        display: flex; justify-content: space-between; align-items: center;
        padding: ${t.spacing.md} ${t.spacing.lg}; font-size: ${t.typography.fontSize.xs};
        color: ${t.colors.neutral[500]}; border-top: 1px solid ${t.colors.neutral[200]};
        background: ${t.colors.neutral[50]};
      }
    `;
  }
}

module.exports = CDSFooter;
