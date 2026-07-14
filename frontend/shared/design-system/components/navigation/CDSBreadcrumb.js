/**
 * CDSBreadcrumb — Navegação hierárquica oficial
 *
 * @module frontend/shared/design-system/components/navigation/CDSBreadcrumb
 */

const theme = require('../../theme');

class CDSBreadcrumb {
  /**
   * @param {Object} options
   * @param {{ label: string, onClick?: Function }[]} options.items
   */
  static create(options = {}) {
    const { items = [] } = options;
    const nav = document.createElement('nav');
    nav.className = 'cds-breadcrumb';
    nav.setAttribute('aria-label', 'Navegação');

    items.forEach((item, idx) => {
      if (idx > 0) {
        const sep = document.createElement('span');
        sep.className = 'cds-breadcrumb__sep';
        sep.textContent = '/';
        sep.setAttribute('aria-hidden', 'true');
        nav.appendChild(sep);
      }
      if (item.onClick && idx < items.length - 1) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cds-breadcrumb__link';
        btn.textContent = item.label;
        btn.addEventListener('click', item.onClick);
        nav.appendChild(btn);
      } else {
        const span = document.createElement('span');
        span.className = 'cds-breadcrumb__current';
        span.textContent = item.label;
        nav.appendChild(span);
      }
    });

    return nav;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-breadcrumb { display: flex; align-items: center; gap: ${t.spacing.sm}; flex-wrap: wrap; font-size: ${t.typography.fontSize.sm}; }
      .cds-breadcrumb__sep { color: ${t.colors.neutral[400]}; }
      .cds-breadcrumb__link { border: none; background: none; padding: 0; color: ${t.colors.primary[600]}; cursor: pointer; }
      .cds-breadcrumb__link:hover { text-decoration: underline; }
      .cds-breadcrumb__current { color: ${t.colors.neutral[600]}; }
    `;
  }
}

module.exports = CDSBreadcrumb;
