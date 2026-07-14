/**
 * CDSPageHeader — Cabeçalho de página oficial
 *
 * @module frontend/shared/design-system/components/layouts/CDSPageHeader
 */

const theme = require('../../theme');
const CDSBackButton = require('../navigation/CDSBackButton');

class CDSPageHeader {
  /**
   * @param {Object} options
   * @param {string} [options.title]
   * @param {string} [options.subtitle]
   * @param {HTMLElement[]} [options.actions]
   * @param {Function} [options.onBack]
   * @param {string} [options.backLabel]
   */
  static create(options = {}) {
    const { title = '', subtitle = '', actions = [], onBack = null, backLabel = 'Voltar' } = options;
    const header = document.createElement('div');
    header.className = 'cds-page-header';

    const top = document.createElement('div');
    top.className = 'cds-page-header__top';

    if (onBack) {
      top.appendChild(CDSBackButton.create({ label: backLabel, onClick: onBack }));
    }

    const titles = document.createElement('div');
    titles.className = 'cds-page-header__titles';
    if (title) {
      const h1 = document.createElement('h1');
      h1.className = 'cds-page-header__title';
      h1.textContent = title;
      titles.appendChild(h1);
    }
    if (subtitle) {
      const p = document.createElement('p');
      p.className = 'cds-page-header__subtitle';
      p.textContent = subtitle;
      titles.appendChild(p);
    }
    top.appendChild(titles);

    if (actions.length) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'cds-page-header__actions';
      actions.forEach((a) => actionsEl.appendChild(a));
      top.appendChild(actionsEl);
    }

    header.appendChild(top);
    return header;
  }

  static getStyles() {
    const t = theme;
    return `
      ${CDSBackButton.getStyles()}
      .cds-page-header { margin-bottom: ${t.spacing.lg}; }
      .cds-page-header__top {
        display: flex; align-items: flex-start; justify-content: space-between;
        gap: ${t.spacing.md}; flex-wrap: wrap;
      }
      .cds-page-header__titles { flex: 1; min-width: 200px; }
      .cds-page-header__title {
        margin: 0 0 ${t.spacing.xs};
        font-size: ${t.typography.fontSize['2xl']};
        font-weight: ${t.typography.fontWeight.semibold};
        color: ${t.colors.neutral[900]};
        letter-spacing: ${t.typography.letterSpacing.tight};
      }
      .cds-page-header__subtitle {
        margin: 0; font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[600]};
      }
      .cds-page-header__actions {
        display: flex; gap: ${t.spacing.sm}; flex-wrap: wrap; align-items: center;
      }
    `;
  }
}

module.exports = CDSPageHeader;
