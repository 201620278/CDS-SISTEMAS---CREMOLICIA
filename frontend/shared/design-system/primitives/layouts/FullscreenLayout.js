/**
 * FullscreenLayout — Fullscreen Layout Component
 *
 * Sprint 2.7: Arquitetura Frontend — layout Fullscreen.
 *
 * @module frontend/modules/motor-comercial/components/layouts/FullscreenLayout
 */

const theme = require('../../theme');

class FullscreenLayout {
  /**
   * Creates a fullscreen layout.
   * @param {Object} options
   * @param {HTMLElement} options.header - Header content
   * @param {HTMLElement} options.content - Main content
   * @param {HTMLElement} [options.toolbar] - Toolbar content
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      header = null,
      content = null,
      toolbar = null
    } = options;

    const layout = document.createElement('div');
    layout.className = 'cds-fullscreen-layout';

    if (header) {
      const headerEl = document.createElement('header');
      headerEl.className = 'cds-fullscreen-layout__header';
      headerEl.appendChild(header);
      layout.appendChild(headerEl);
    }

    const main = document.createElement('main');
    main.className = 'cds-fullscreen-layout__main';

    if (toolbar) {
      const toolbarEl = document.createElement('div');
      toolbarEl.className = 'cds-fullscreen-layout__toolbar';
      toolbarEl.appendChild(toolbar);
      main.appendChild(toolbarEl);
    }

    if (content) {
      const contentEl = document.createElement('div');
      contentEl.className = 'cds-fullscreen-layout__content';
      contentEl.appendChild(content);
      main.appendChild(contentEl);
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
      .cds-fullscreen-layout {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        background-color: var(--color-surface);
        z-index: ${t.zindex.modal};
      }

      .cds-fullscreen-layout__header {
        background-color: var(--color-surface);
        border-bottom: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.md} ${t.spacing.lg};
        flex-shrink: 0;
      }

      .cds-fullscreen-layout__main {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .cds-fullscreen-layout__toolbar {
        background-color: ${t.colors.neutral[50]};
        border-bottom: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.md} ${t.spacing.lg};
        flex-shrink: 0;
      }

      .cds-fullscreen-layout__content {
        flex: 1;
        overflow-y: auto;
        padding: ${t.spacing.lg};
      }
    `;
  }
}

module.exports = FullscreenLayout;
