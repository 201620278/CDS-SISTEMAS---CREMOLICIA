/**
 * DashboardLayout — Dashboard Layout Component
 *
 * Sprint 2.7: Arquitetura Frontend — layout Dashboard.
 *
 * @module frontend/modules/motor-comercial/components/layouts/DashboardLayout
 */

const theme = require('../../theme');

class DashboardLayout {
  /**
   * Creates a dashboard layout.
   * @param {Object} options
   * @param {HTMLElement} options.header - Header content
   * @param {HTMLElement} options.sidebar - Sidebar content
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
    layout.className = 'cds-dashboard-layout';

    if (header) {
      const headerEl = document.createElement('header');
      headerEl.className = 'cds-dashboard-layout__header';
      headerEl.appendChild(header);
      layout.appendChild(headerEl);
    }

    const main = document.createElement('div');
    main.className = 'cds-dashboard-layout__main';

    if (sidebar) {
      const sidebarEl = document.createElement('aside');
      sidebarEl.className = 'cds-dashboard-layout__sidebar';
      sidebarEl.appendChild(sidebar);
      main.appendChild(sidebarEl);
    }

    if (content) {
      const contentEl = document.createElement('main');
      contentEl.className = 'cds-dashboard-layout__content';
      contentEl.appendChild(content);
      main.appendChild(contentEl);
    }

    layout.appendChild(main);

    if (footer) {
      const footerEl = document.createElement('footer');
      footerEl.className = 'cds-dashboard-layout__footer';
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
      .cds-dashboard-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: ${t.colors.neutral[50]};
      }

      .cds-dashboard-layout__header {
        background-color: var(--color-surface);
        border-bottom: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.md} ${t.spacing.lg};
        position: sticky;
        top: 0;
        z-index: ${t.zindex.sticky};
      }

      .cds-dashboard-layout__main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .cds-dashboard-layout__sidebar {
        width: 250px;
        background-color: var(--color-surface);
        border-right: 1px solid ${t.colors.neutral[200]};
        overflow-y: auto;
        flex-shrink: 0;
      }

      .cds-dashboard-layout__content {
        flex: 1;
        overflow-y: auto;
        padding: ${t.spacing.lg};
      }

      .cds-dashboard-layout__footer {
        background-color: var(--color-surface);
        border-top: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.md} ${t.spacing.lg};
      }
    `;
  }
}

module.exports = DashboardLayout;
