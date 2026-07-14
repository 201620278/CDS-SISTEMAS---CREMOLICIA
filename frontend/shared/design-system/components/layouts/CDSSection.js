/**
 * CDSSection — Seção de conteúdo oficial
 *
 * @module frontend/shared/design-system/components/layouts/CDSSection
 */

const theme = require('../../theme');

class CDSSection {
  static create(options = {}) {
    const { title = '', description = '', content = null, actions = [] } = options;
    const section = document.createElement('section');
    section.className = 'cds-section';

    if (title || description || actions.length) {
      const head = document.createElement('div');
      head.className = 'cds-section__head';
      const text = document.createElement('div');
      if (title) {
        const h2 = document.createElement('h2');
        h2.className = 'cds-section__title';
        h2.textContent = title;
        text.appendChild(h2);
      }
      if (description) {
        const p = document.createElement('p');
        p.className = 'cds-section__description';
        p.textContent = description;
        text.appendChild(p);
      }
      head.appendChild(text);
      if (actions.length) {
        const act = document.createElement('div');
        act.className = 'cds-section__actions';
        actions.forEach((a) => act.appendChild(a));
        head.appendChild(act);
      }
      section.appendChild(head);
    }

    if (content) {
      const body = document.createElement('div');
      body.className = 'cds-section__body';
      body.appendChild(content);
      section.appendChild(body);
    }

    return section;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-section { margin-bottom: ${t.spacing.xl}; }
      .cds-section__head {
        display: flex; justify-content: space-between; align-items: flex-start;
        gap: ${t.spacing.md}; margin-bottom: ${t.spacing.md};
      }
      .cds-section__title {
        margin: 0 0 ${t.spacing.xs}; font-size: ${t.typography.fontSize.lg};
        font-weight: ${t.typography.fontWeight.semibold}; color: ${t.colors.neutral[800]};
      }
      .cds-section__description { margin: 0; font-size: ${t.typography.fontSize.sm}; color: ${t.colors.neutral[600]}; }
      .cds-section__actions { display: flex; gap: ${t.spacing.sm}; }
      .cds-section__body { }
    `;
  }
}

module.exports = CDSSection;
