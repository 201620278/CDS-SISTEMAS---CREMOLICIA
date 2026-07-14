/**
 * CDSFilterBar — Barra de filtros oficial
 *
 * @module frontend/shared/design-system/components/search/CDSFilterBar
 */

const theme = require('../../theme');

class CDSFilterBar {
  /**
   * @param {Object} options
   * @param {{ key: string, label: string, options: { value: string, label: string }[] }[]} options.filters
   * @param {Function} [options.onChange]
   */
  static create(options = {}) {
    const { filters = [], onChange = null } = options;
    const bar = document.createElement('div');
    bar.className = 'cds-filter-bar';

    filters.forEach((filter) => {
      const field = document.createElement('div');
      field.className = 'cds-filter-bar__field';

      const label = document.createElement('label');
      label.textContent = filter.label;
      label.htmlFor = `filter-${filter.key}`;

      const select = document.createElement('select');
      select.id = `filter-${filter.key}`;
      select.className = 'cds-filter-bar__select';
      select.dataset.filterKey = filter.key;

      (filter.options || []).forEach((opt) => {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = opt.label;
        select.appendChild(o);
      });

      select.addEventListener('change', () => {
        if (!onChange) return;
        const values = {};
        bar.querySelectorAll('select').forEach((s) => { values[s.dataset.filterKey] = s.value; });
        onChange(values);
      });

      field.appendChild(label);
      field.appendChild(select);
      bar.appendChild(field);
    });

    return bar;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-filter-bar { display: flex; flex-wrap: wrap; gap: ${t.spacing.md}; }
      .cds-filter-bar__field { display: flex; flex-direction: column; gap: ${t.spacing.xs}; min-width: 140px; }
      .cds-filter-bar label { font-size: ${t.typography.fontSize.xs}; color: ${t.colors.neutral[600]}; }
      .cds-filter-bar__select {
        padding: ${t.spacing.sm}; border: 1px solid ${t.colors.neutral[300]};
        border-radius: ${t.radius.md}; font-size: ${t.typography.fontSize.sm};
      }
    `;
  }
}

module.exports = CDSFilterBar;
