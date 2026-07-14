/**
 * CDSFormSection — Seção de formulário oficial
 *
 * @module frontend/shared/design-system/components/forms/CDSFormSection
 */

const theme = require('../../theme');

class CDSFormSection {
  static create(options = {}) {
    const { title = '', description = '', fields = [] } = options;
    const section = document.createElement('fieldset');
    section.className = 'cds-form-section';

    if (title) {
      const legend = document.createElement('legend');
      legend.className = 'cds-form-section__title';
      legend.textContent = title;
      section.appendChild(legend);
    }
    if (description) {
      const p = document.createElement('p');
      p.className = 'cds-form-section__description';
      p.textContent = description;
      section.appendChild(p);
    }
    const grid = document.createElement('div');
    grid.className = 'cds-form-section__grid';
    fields.forEach((f) => grid.appendChild(f));
    section.appendChild(grid);
    return section;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-form-section { border: 1px solid ${t.colors.neutral[200]}; border-radius: ${t.radius.lg}; padding: ${t.spacing.lg}; margin-bottom: ${t.spacing.lg}; }
      .cds-form-section__title { font-size: ${t.typography.fontSize.base}; font-weight: ${t.typography.fontWeight.semibold}; padding: 0 ${t.spacing.sm}; }
      .cds-form-section__description { margin: 0 0 ${t.spacing.md}; font-size: ${t.typography.fontSize.sm}; color: ${t.colors.neutral[600]}; }
      .cds-form-section__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: ${t.spacing.md}; }
    `;
  }
}

module.exports = CDSFormSection;
