/**
 * KanbanCard — Special Kanban Card Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente KanbanCard.
 *
 * @module frontend/modules/motor-comercial/components/special/KanbanCard
 */

const theme = require('../../theme');

class KanbanCard {
  /**
   * Creates a kanban card.
   * @param {Object} options
   * @param {string} options.title - Card title
   * @param {string} [options.description] - Card description
   * @param {string} [options.priority] - Priority (low, medium, high)
   * @param {HTMLElement} [options.tags] - Tags element
   * @param {HTMLElement} [options.actions] - Actions element
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      title = '',
      description = '',
      priority = null,
      tags = null,
      actions = null
    } = options;

    const card = document.createElement('div');
    card.className = 'cds-kanban-card';

    if (priority) {
      const priorityEl = document.createElement('div');
      priorityEl.className = `cds-kanban-card__priority cds-kanban-card__priority--${priority}`;
      card.appendChild(priorityEl);
    }

    const content = document.createElement('div');
    content.className = 'cds-kanban-card__content';

    const titleEl = document.createElement('h4');
    titleEl.className = 'cds-kanban-card__title';
    titleEl.textContent = title;
    content.appendChild(titleEl);

    if (description) {
      const descEl = document.createElement('p');
      descEl.className = 'cds-kanban-card__description';
      descEl.textContent = description;
      content.appendChild(descEl);
    }

    if (tags) {
      const tagsEl = document.createElement('div');
      tagsEl.className = 'cds-kanban-card__tags';
      tagsEl.appendChild(tags);
      content.appendChild(tagsEl);
    }

    card.appendChild(content);

    if (actions) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'cds-kanban-card__actions';
      actionsEl.appendChild(actions);
      card.appendChild(actionsEl);
    }

    return card;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-kanban-card {
        background-color: var(--color-surface);
        border: 1px solid ${t.colors.neutral[200]};
        border-radius: ${t.radius.md};
        padding: ${t.spacing.md};
        cursor: grab;
        transition: box-shadow ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-kanban-card:hover {
        box-shadow: ${t.shadow.md};
      }

      .cds-kanban-card__priority {
        width: 4px;
        height: 100%;
        position: absolute;
        left: 0;
        top: 0;
        border-radius: ${t.radius.sm} 0 0 ${t.radius.sm};
      }

      .cds-kanban-card__priority--low {
        background-color: ${t.colors.success[600]};
      }

      .cds-kanban-card__priority--medium {
        background-color: ${t.colors.warning[600]};
      }

      .cds-kanban-card__priority--high {
        background-color: ${t.colors.error[600]};
      }

      .cds-kanban-card__content {
        margin-left: ${t.spacing.xs};
      }

      .cds-kanban-card__title {
        margin: 0 0 ${t.spacing.xs} 0;
        font-size: ${t.typography.fontSize.sm};
        font-weight: ${t.typography.fontWeight.semibold};
        color: ${t.colors.neutral[900]};
      }

      .cds-kanban-card__description {
        margin: 0 0 ${t.spacing.sm} 0;
        font-size: ${t.typography.fontSize.xs};
        color: ${t.colors.neutral[600]};
        line-height: ${t.typography.lineHeight.tight};
      }

      .cds-kanban-card__tags {
        display: flex;
        gap: ${t.spacing.xs};
        flex-wrap: wrap;
        margin-bottom: ${t.spacing.sm};
      }

      .cds-kanban-card__actions {
        display: flex;
        justify-content: flex-end;
        gap: ${t.spacing.xs};
        margin-top: ${t.spacing.sm};
      }
    `;
  }
}

module.exports = KanbanCard;
