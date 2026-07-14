/**
 * KanbanColumn — Special Kanban Column Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente KanbanColumn.
 *
 * @module frontend/modules/motor-comercial/components/special/KanbanColumn
 */

const theme = require('../../theme');

class KanbanColumn {
  /**
   * Creates a kanban column.
   * @param {Object} options
   * @param {string} options.title - Column title
   * @param {number} [options.count] - Item count
   * @param {string} [options.status] - Status color
   * @param {HTMLElement} [options.headerActions] - Header actions
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      title = '',
      count = 0,
      status = 'neutral',
      headerActions = null
    } = options;

    const column = document.createElement('div');
    column.className = `cds-kanban-column cds-kanban-column--${status}`;

    const header = document.createElement('div');
    header.className = 'cds-kanban-column__header';

    const titleContainer = document.createElement('div');
    titleContainer.className = 'cds-kanban-column__title-container';

    const titleEl = document.createElement('h3');
    titleEl.className = 'cds-kanban-column__title';
    titleEl.textContent = title;
    titleContainer.appendChild(titleEl);

    const countEl = document.createElement('span');
    countEl.className = 'cds-kanban-column__count';
    countEl.textContent = count;
    titleContainer.appendChild(countEl);

    header.appendChild(titleContainer);

    if (headerActions) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'cds-kanban-column__actions';
      actionsEl.appendChild(headerActions);
      header.appendChild(actionsEl);
    }

    column.appendChild(header);

    const content = document.createElement('div');
    content.className = 'cds-kanban-column__content';
    column.appendChild(content);

    return column;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-kanban-column {
        background-color: ${t.colors.neutral[50]};
        border-radius: ${t.radius.lg};
        padding: ${t.spacing.md};
        min-width: 280px;
        max-width: 350px;
        display: flex;
        flex-direction: column;
        gap: ${t.spacing.md};
      }

      .cds-kanban-column--primary {
        border-top: 4px solid ${t.colors.primary[600]};
      }

      .cds-kanban-column--success {
        border-top: 4px solid ${t.colors.success[600]};
      }

      .cds-kanban-column--warning {
        border-top: 4px solid ${t.colors.warning[600]};
      }

      .cds-kanban-column--error {
        border-top: 4px solid ${t.colors.error[600]};
      }

      .cds-kanban-column__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cds-kanban-column__title-container {
        display: flex;
        align-items: center;
        gap: ${t.spacing.sm};
      }

      .cds-kanban-column__title {
        margin: 0;
        font-size: ${t.typography.fontSize.base};
        font-weight: ${t.typography.fontWeight.semibold};
        color: ${t.colors.neutral[900]};
      }

      .cds-kanban-column__count {
        background-color: ${t.colors.neutral[200]};
        color: ${t.colors.neutral[700]};
        padding: ${t.spacing.xs} ${t.spacing.sm};
        border-radius: ${t.radius.full};
        font-size: ${t.typography.fontSize.xs};
        font-weight: ${t.typography.fontWeight.medium};
      }

      .cds-kanban-column__actions {
        display: flex;
        gap: ${t.spacing.xs};
      }

      .cds-kanban-column__content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: ${t.spacing.sm};
        min-height: 100px;
      }
    `;
  }
}

module.exports = KanbanColumn;
