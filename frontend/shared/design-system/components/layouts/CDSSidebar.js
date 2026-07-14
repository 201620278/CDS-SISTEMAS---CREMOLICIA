/**
 * CDSSidebar — Barra lateral de navegação oficial
 *
 * @module frontend/shared/design-system/components/layouts/CDSSidebar
 */

const theme = require('../../theme');

class CDSSidebar {
  static create(options = {}) {
    const { title = 'Navegação', items = [] } = options;
    const nav = document.createElement('nav');
    nav.className = 'cds-sidebar';

    if (title) {
      const h3 = document.createElement('h3');
      h3.className = 'cds-sidebar__title';
      h3.textContent = title;
      nav.appendChild(h3);
    }

    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cds-sidebar__item${item.active ? ' cds-sidebar__item--active' : ''}`;
      btn.innerHTML = `${item.icon ? `<span>${item.icon}</span> ` : ''}${item.label}`;
      btn.addEventListener('click', item.onClick || (() => {}));
      nav.appendChild(btn);
    });

    return nav;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-sidebar {
        padding: ${t.spacing.md}; background: ${t.colors.neutral[50]};
        border-radius: ${t.radius.lg}; border: 1px solid ${t.colors.neutral[200]};
        min-width: 200px;
      }
      .cds-sidebar__title {
        margin: 0 0 ${t.spacing.md}; font-size: ${t.typography.fontSize.xs};
        text-transform: uppercase; letter-spacing: ${t.typography.letterSpacing.caps};
        color: ${t.colors.neutral[500]};
      }
      .cds-sidebar__item {
        display: block; width: 100%; text-align: left;
        padding: ${t.spacing.sm} ${t.spacing.md}; border: none; background: transparent;
        border-radius: ${t.radius.md}; cursor: pointer; font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[700]}; margin-bottom: 2px;
      }
      .cds-sidebar__item:hover { background: ${t.colors.primary[50]}; color: ${t.colors.primary[700]}; }
      .cds-sidebar__item--active { background: ${t.colors.primary[100]}; color: ${t.colors.primary[800]}; font-weight: ${t.typography.fontWeight.medium}; }
    `;
  }
}

module.exports = CDSSidebar;
