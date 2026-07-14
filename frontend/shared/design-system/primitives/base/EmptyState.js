/**
 * EmptyState — Base EmptyState Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente EmptyState.
 *
 * @module frontend/modules/motor-comercial/components/base/EmptyState
 */

const theme = require('../../theme');

class EmptyState {
  /**
   * Creates an empty state element.
   * @param {Object} options
   * @param {string} [options.title] - Title
   * @param {string} [options.description] - Description
   * @param {string} [options.icon] - Icon
   * @param {HTMLElement} [options.action] - Action button
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      title = '',
      description = '',
      icon = null,
      action = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-empty-state';

    if (icon) {
      const iconEl = document.createElement('div');
      iconEl.className = 'cds-empty-state__icon';
      iconEl.innerHTML = icon;
      container.appendChild(iconEl);
    }

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'cds-empty-state__title';
      titleEl.textContent = title;
      container.appendChild(titleEl);
    }

    if (description) {
      const descEl = document.createElement('p');
      descEl.className = 'cds-empty-state__description';
      descEl.textContent = description;
      container.appendChild(descEl);
    }

    if (action) {
      const actionEl = document.createElement('div');
      actionEl.className = 'cds-empty-state__action';
      actionEl.appendChild(action);
      container.appendChild(actionEl);
    }

    return container;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: ${t.spacing.xxl} ${t.spacing.lg};
        text-align: center;
      }

      .cds-empty-state__icon {
        font-size: ${t.typography.fontSize['5xl']};
        margin-bottom: ${t.spacing.md};
        opacity: 0.5;
      }

      .cds-empty-state__title {
        margin: 0 0 ${t.spacing.sm} 0;
        font-size: ${t.typography.fontSize.lg};
        font-weight: ${t.typography.fontWeight.medium};
        color: ${t.colors.neutral[700]};
      }

      .cds-empty-state__description {
        margin: 0 0 ${t.spacing.lg} 0;
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[500]};
        max-width: 400px;
      }

      .cds-empty-state__action {
        margin-top: ${t.spacing.md};
      }
    `;
  }
}

module.exports = EmptyState;
