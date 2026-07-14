/**
 * ComercialLayout — Comercial Layout for Motor Comercial
 *
 * Sprint 2.7: Arquitetura Frontend — layout Comercial.
 *
 * @module frontend/modules/motor-comercial/components/layouts/ComercialLayout
 */

const theme = require('../../theme');

class ComercialLayout {
  /**
   * Creates a comercial layout.
   * @param {Object} options
   * @param {HTMLElement} options.header - Header content
   * @param {HTMLElement} options.sidebar - Sidebar navigation
   * @param {HTMLElement} options.content - Main content
   * @param {HTMLElement} [options.footer] - Footer content
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      header = null,
      sidebar = null,
      content = null,
      footer = null
    } = options;

    const layout = document.createElement('div');
    layout.className = 'cds-comercial-layout';

    if (header) {
      const headerEl = document.createElement('header');
      headerEl.className = 'cds-comercial-layout__header';
      headerEl.appendChild(header);
      layout.appendChild(headerEl);
    }

    const main = document.createElement('div');
    main.className = 'cds-comercial-layout__main';

    if (sidebar) {
      const sidebarEl = document.createElement('aside');
      sidebarEl.className = 'cds-comercial-layout__sidebar';
      sidebarEl.appendChild(sidebar);
      main.appendChild(sidebarEl);
    }

    if (content) {
      const contentEl = document.createElement('main');
      contentEl.className = 'cds-comercial-layout__content';
      contentEl.appendChild(content);
      main.appendChild(contentEl);
    }

    layout.appendChild(main);

    if (footer) {
      const footerEl = document.createElement('footer');
      footerEl.className = 'cds-comercial-layout__footer';
      footerEl.appendChild(footer);
      layout.appendChild(footerEl);
    }

    return layout;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-comercial-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: ${t.colors.neutral[50]};
      }

      .cds-comercial-layout__header {
        background-color: ${t.colors.primary[600]};
        color: var(--color-action-text);
        padding: ${t.spacing.md} ${t.spacing.lg};
        position: sticky;
        top: 0;
        z-index: ${t.zindex.sticky};
      }

      .cds-comercial-layout__main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .cds-comercial-layout__sidebar {
        width: 280px;
        background-color: var(--color-surface);
        border-right: 1px solid ${t.colors.neutral[200]};
        overflow-y: auto;
        flex-shrink: 0;
      }

      .cds-comercial-layout__content {
        flex: 1;
        overflow-y: auto;
        padding: ${t.spacing.lg};
      }

      .cds-comercial-layout__footer {
        background-color: var(--color-surface);
        border-top: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.md} ${t.spacing.lg};
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[600]};
      }
    `;
  }
}

module.exports = ComercialLayout;
