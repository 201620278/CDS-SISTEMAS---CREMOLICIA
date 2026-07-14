/**
 * CDSSearchBar — Barra de busca oficial
 *
 * @module frontend/shared/design-system/components/search/CDSSearchBar
 */

const theme = require('../../theme');

class CDSSearchBar {
  static create(options = {}) {
    const { placeholder = 'Buscar...', value = '', onSearch = null, onInput = null } = options;
    const wrap = document.createElement('div');
    wrap.className = 'cds-search-bar';

    const input = document.createElement('input');
    input.type = 'search';
    input.className = 'cds-search-bar__input';
    input.placeholder = placeholder;
    input.value = value;

    const trigger = () => { if (onSearch) onSearch(input.value); };
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') trigger(); });
    if (onInput) input.addEventListener('input', () => onInput(input.value));

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cds-search-bar__btn';
    btn.textContent = 'Buscar';
    btn.addEventListener('click', trigger);

    wrap.appendChild(input);
    wrap.appendChild(btn);
    return wrap;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-search-bar { display: flex; gap: ${t.spacing.sm}; width: 100%; }
      .cds-search-bar__input {
        flex: 1; padding: ${t.spacing.sm} ${t.spacing.md};
        border: 1px solid ${t.colors.neutral[300]}; border-radius: ${t.radius.md};
        font-size: ${t.typography.fontSize.sm};
      }
      .cds-search-bar__input:focus { outline: none; border-color: ${t.colors.primary[500]}; box-shadow: 0 0 0 3px ${t.colors.primary[100]}; }
      .cds-search-bar__btn {
        padding: ${t.spacing.sm} ${t.spacing.md}; background: ${t.colors.primary[600]};
        color: var(--color-action-text); border: none; border-radius: ${t.radius.md}; cursor: pointer;
      }
    `;
  }
}

module.exports = CDSSearchBar;
