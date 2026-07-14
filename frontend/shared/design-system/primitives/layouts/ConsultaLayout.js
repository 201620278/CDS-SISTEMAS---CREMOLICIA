/**
 * ConsultaLayout — Consulta Layout Component
 *
 * Sprint 2.7: Arquitetura Frontend — layout Consulta.
 *
 * @module frontend/modules/motor-comercial/components/layouts/ConsultaLayout
 */

const theme = require('../../theme');

class ConsultaLayout {
  /**
   * Creates a consulta layout.
   * @param {Object} options
   * @param {HTMLElement} options.header - Header content
   * @param {HTMLElement} options.filters - Filter content
   * @param {HTMLElement} options.content - Table content
   * @param {HTMLElement} [options.pagination] - Pagination content
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      header = null,
      filters = null,
      content = null,
      pagination = null
    } = options;

    const layout = document.createElement('div');
    layout.className = 'cds-consulta-layout';

    if (header) {
      const headerEl = document.createElement('header');
      headerEl.className = 'cds-consulta-layout__header';
      headerEl.appendChild(header);
      layout.appendChild(headerEl);
    }

    const main = document.createElement('main');
    main.className = 'cds-consulta-layout__main';
    main.appendChild(layout);

    if (filters) {
      const filtersEl = document.createElement('div');
      filtersEl.className = 'cds-consulta-layout__filters';
      filtersEl.appendChild(filters);
      main.appendChild(filtersEl);
    }

    if (content) {
      const contentEl = document.createElement('div');
      contentEl.className = 'cds-consulta-layout__content';
      contentEl.appendChild(content);
      main.appendChild(contentEl);
    }

    if (pagination) {
      const paginationEl = document.createElement('div');
      paginationEl.className = 'cds-consulta-layout__pagination';
      paginationEl.appendChild(pagination);
      main.appendChild(paginationEl);
    }

    layout.appendChild(main);

    return layout;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-consulta-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: ${t.colors.neutral[50]};
      }

      .cds-consulta-layout__header {
        background-color: var(--color-surface);
        border-bottom: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.md} ${t.spacing.lg};
      }

      .cds-consulta-layout__main {
        flex: 1;
        padding: ${t.spacing.lg};
        overflow-y: auto;
      }

      .cds-consulta-layout__filters {
        background-color: var(--color-surface);
        border: 1px solid ${t.colors.neutral[200]};
        border-radius: ${t.radius.lg};
        padding: ${t.spacing.md};
        margin-bottom: ${t.spacing.lg};
      }

      .cds-consulta-layout__content {
        background-color: var(--color-surface);
        border: 1px solid ${t.colors.neutral[200]};
        border-radius: ${t.radius.lg};
        overflow: hidden;
        margin-bottom: ${t.spacing.lg};
      }

      .cds-consulta-layout__pagination {
        display: flex;
        justify-content: center;
      }
    `;
  }
}

module.exports = ConsultaLayout;
