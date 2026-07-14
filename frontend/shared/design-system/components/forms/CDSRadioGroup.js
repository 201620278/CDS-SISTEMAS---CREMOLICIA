/**
 * CDSRadioGroup — Grupo de opções exclusivas
 *
 * @module frontend/shared/design-system/components/forms/CDSRadioGroup
 */

const theme = require('../../theme');

class CDSRadioGroup {
  static create(options = {}) {
    const { name = 'cds-radio', label = '', options: items = [], value = '', onChange = null } = options;
    const group = document.createElement('div');
    group.className = 'cds-radio-group';
    group.setAttribute('role', 'radiogroup');

    if (label) {
      const lbl = document.createElement('span');
      lbl.className = 'cds-radio-group__label';
      lbl.textContent = label;
      group.appendChild(lbl);
    }

    items.forEach((item) => {
      const row = document.createElement('label');
      row.className = 'cds-radio-group__option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.value = item.value;
      input.checked = item.value === value;
      input.addEventListener('change', () => { if (onChange) onChange(item.value); });
      row.appendChild(input);
      row.appendChild(document.createTextNode(item.label));
      group.appendChild(row);
    });

    return group;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-radio-group { display: flex; flex-direction: column; gap: ${t.spacing.sm}; }
      .cds-radio-group__label { font-size: ${t.typography.fontSize.sm}; font-weight: ${t.typography.fontWeight.medium}; margin-bottom: ${t.spacing.xs}; }
      .cds-radio-group__option { display: flex; align-items: center; gap: ${t.spacing.sm}; font-size: ${t.typography.fontSize.sm}; cursor: pointer; }
    `;
  }
}

module.exports = CDSRadioGroup;
