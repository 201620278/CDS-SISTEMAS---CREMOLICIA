/**
 * CadastroLayout — Cadastro Layout Component
 *
 * Sprint 2.7: Arquitetura Frontend — layout Cadastro.
 *
 * @module frontend/modules/motor-comercial/components/layouts/CadastroLayout
 */

const theme = require('../../theme');

class CadastroLayout {
  /**
   * Creates a cadastro layout.
   * @param {Object} options
   * @param {HTMLElement} options.header - Header content
   * @param {HTMLElement} options.toolbar - Toolbar content
   * @param {HTMLElement} options.content - Form content
   * @param {HTMLElement} [options.sidebar] - Sidebar content
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      header = null,
      toolbar = null,
      content = null,
      sidebar = null
    } = options;

    const layout = document.createElement('div');
    layout.className = 'cds-cadastro-layout';

    if (header) {
      const headerEl = document.createElement('header');
      headerEl.className = 'cds-cadastro-layout__header';
      headerEl.appendChild(header);
      layout.appendChild(headerEl);
    }

    const main = document.createElement('div');
    main.className = 'cds-cadastro-layout__main';

    if (sidebar) {
      const sidebarEl = document.createElement('aside');
      sidebarEl.className = 'cds-cadastro-layout__sidebar';
      sidebarEl.appendChild(sidebar);
      main.appendChild(sidebarEl);
    }

    const contentContainer = document.createElement('div');
    contentContainer.className = 'cds-cadastro-layout__content';

    if (toolbar) {
      const toolbarEl = document.createElement('div');
      toolbarEl.className = 'cds-cadastro-layout__toolbar';
      toolbarEl.appendChild(toolbar);
      contentContainer.appendChild(toolbarEl);
    }

    if (content) {
      const contentEl = document.createElement('div');
      contentEl.className = 'cds-cadastro-layout__form';
      contentEl.appendChild(content);
      contentContainer.appendChild(contentEl);
    }

    main.appendChild(contentContainer);
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
      .cds-cadastro-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background-color: ${t.colors.neutral[50]};
      }

      .cds-cadastro-layout__header {
        background-color: var(--color-surface);
        border-bottom: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.md} ${t.spacing.lg};
      }

      .cds-cadastro-layout__main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .cds-cadastro-layout__sidebar {
        width: 300px;
        background-color: var(--color-surface);
        border-right: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.lg};
        overflow-y: auto;
        flex-shrink: 0;
      }

      .cds-cadastro-layout__content {
        flex: 1;
        overflow-y: auto;
        padding: ${t.spacing.lg};
      }

      .cds-cadastro-layout__toolbar {
        background-color: var(--color-surface);
        border: 1px solid ${t.colors.neutral[200]};
        border-radius: ${t.radius.lg};
        padding: ${t.spacing.md};
        margin-bottom: ${t.spacing.lg};
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cds-cadastro-layout__form {
        background-color: var(--color-surface);
        border: 1px solid ${t.colors.neutral[200]};
        border-radius: ${t.radius.lg};
        padding: ${t.spacing.xl};
      }
    `;
  }
}

module.exports = CadastroLayout;
