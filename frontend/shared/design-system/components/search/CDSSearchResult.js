/**
 * CDSSearchResult — Item de resultado de busca
 *
 * @module frontend/shared/design-system/components/search/CDSSearchResult
 */

const theme = require('../../theme');

class CDSSearchResult {
  static create(options = {}) {
    const { title = '', subtitle = '', meta = '', onClick = null, active = false } = options;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `cds-search-result${active ? ' cds-search-result--active' : ''}`;
    item.innerHTML = `
      <span class="cds-search-result__title">${title}</span>
      ${subtitle ? `<span class="cds-search-result__subtitle">${subtitle}</span>` : ''}
      ${meta ? `<span class="cds-search-result__meta">${meta}</span>` : ''}
    `;
    if (onClick) item.addEventListener('click', onClick);
    return item;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-search-result {
        display: flex; flex-direction: column; align-items: flex-start; width: 100%;
        text-align: left; padding: ${t.spacing.md}; border: 1px solid ${t.colors.neutral[200]};
        border-radius: ${t.radius.md}; background: var(--color-surface); cursor: pointer; margin-bottom: ${t.spacing.sm};
      }
      .cds-search-result:hover, .cds-search-result--active { border-color: ${t.colors.primary[300]}; background: ${t.colors.primary[50]}; }
      .cds-search-result__title { font-weight: ${t.typography.fontWeight.medium}; color: ${t.colors.neutral[800]}; }
      .cds-search-result__subtitle { font-size: ${t.typography.fontSize.sm}; color: ${t.colors.neutral[600]}; }
      .cds-search-result__meta { font-size: ${t.typography.fontSize.xs}; color: ${t.colors.neutral[500]}; margin-top: ${t.spacing.xs}; }
    `;
  }
}

module.exports = CDSSearchResult;
