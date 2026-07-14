/**
 * CDSActionPanel — Painel de ações lateral
 *
 * @module frontend/shared/design-system/components/layouts/CDSActionPanel
 */

const theme = require('../../theme');

class CDSActionPanel {
  static create(options = {}) {
    const { title = 'Ações', items = [] } = options;
    const panel = document.createElement('aside');
    panel.className = 'cds-action-panel';

    const h3 = document.createElement('h3');
    h3.className = 'cds-action-panel__title';
    h3.textContent = title;
    panel.appendChild(h3);

    const list = document.createElement('div');
    list.className = 'cds-action-panel__list';
    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cds-action-panel__item';
      btn.innerHTML = `${item.icon ? `<span>${item.icon}</span> ` : ''}${item.label}`;
      btn.addEventListener('click', item.onClick || (() => {}));
      list.appendChild(btn);
    });
    panel.appendChild(list);
    return panel;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-action-panel {
        padding: ${t.spacing.md}; background: ${t.colors.neutral[50]};
        border: 1px solid ${t.colors.neutral[200]}; border-radius: ${t.radius.lg};
      }
      .cds-action-panel__title {
        margin: 0 0 ${t.spacing.md}; font-size: ${t.typography.fontSize.xs};
        text-transform: uppercase; letter-spacing: ${t.typography.letterSpacing.caps};
        color: ${t.colors.neutral[500]};
      }
      .cds-action-panel__item {
        display: block; width: 100%; text-align: left; padding: ${t.spacing.sm} ${t.spacing.md};
        border: none; background: transparent; border-radius: ${t.radius.md}; cursor: pointer;
        font-size: ${t.typography.fontSize.sm}; color: ${t.colors.neutral[700]};
      }
      .cds-action-panel__item:hover { background: ${t.colors.primary[50]}; color: ${t.colors.primary[700]}; }
    `;
  }
}

module.exports = CDSActionPanel;
