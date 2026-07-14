/**
 * GraphContainer — Special Graph Container Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente GraphContainer.
 *
 * @module frontend/modules/motor-comercial/components/special/GraphContainer
 */

const theme = require('../../theme');

class GraphContainer {
  /**
   * Creates a graph container.
   * @param {Object} options
   * @param {string} options.title - Graph title
   * @param {HTMLElement} options.content - Graph content
   * @param {HTMLElement} [options.legend] - Legend content
   * @param {HTMLElement} [options.toolbar] - Toolbar content
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      title = '',
      content = null,
      legend = null,
      toolbar = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-graph-container';

    const header = document.createElement('div');
    header.className = 'cds-graph-container__header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'cds-graph-container__title';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    if (toolbar) {
      const toolbarEl = document.createElement('div');
      toolbarEl.className = 'cds-graph-container__toolbar';
      toolbarEl.appendChild(toolbar);
      header.appendChild(toolbarEl);
    }

    container.appendChild(header);

    const graphArea = document.createElement('div');
    graphArea.className = 'cds-graph-container__graph';
    if (content) graphArea.appendChild(content);
    container.appendChild(graphArea);

    if (legend) {
      const legendEl = document.createElement('div');
      legendEl.className = 'cds-graph-container__legend';
      legendEl.appendChild(legend);
      container.appendChild(legendEl);
    }

    return container;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    return `
      .cds-graph-container {
        background-color: var(--color-surface);
        border: 1px solid var(--color-border, ${theme.colors.neutral[200]});
        border-radius: var(--radius-lg, ${theme.radius.lg});
        padding: var(--spacing-lg, ${theme.spacing.lg});
        box-shadow: var(--shadow-sm, none);
      }

      .cds-graph-container__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md, ${theme.spacing.md});
      }

      .cds-graph-container__title {
        margin: 0;
        font-size: var(--font-size-base, ${theme.typography.fontSize.base});
        font-weight: var(--font-weight-semibold, ${theme.typography.fontWeight.semibold});
        color: var(--color-text, ${theme.colors.neutral[900]});
      }

      .cds-graph-container__toolbar {
        display: flex;
        gap: var(--spacing-sm, ${theme.spacing.sm});
      }

      .cds-graph-container__graph {
        min-height: 240px;
        position: relative;
      }

      .cds-graph-container__legend {
        margin-top: var(--spacing-md, ${theme.spacing.md});
        padding-top: var(--spacing-md, ${theme.spacing.md});
        border-top: 1px solid var(--color-border, ${theme.colors.neutral[200]});
        font-size: var(--font-size-xs, 12px);
        color: var(--color-text-muted, ${theme.colors.neutral[500]});
      }
    `;
  }
}

module.exports = GraphContainer;
