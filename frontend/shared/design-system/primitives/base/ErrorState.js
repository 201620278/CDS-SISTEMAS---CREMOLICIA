/**
 * ErrorState — Base ErrorState Component
 *
 * Sprint O-1: Integração ERP — estado de erro padronizado.
 *
 * @module frontend/modules/motor-comercial/components/base/ErrorState
 */

const theme = require('../../theme');
const Button = require('./Button');

class ErrorState {
  /**
   * Creates an error state element.
   * @param {Object} options
   * @param {string} [options.title] - Title
   * @param {string} [options.description] - Description
   * @param {string} [options.icon] - Icon HTML
   * @param {Function} [options.onRetry] - Retry callback
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      title = 'Não foi possível carregar esta tela',
      description = 'Ocorreu um erro inesperado. Tente novamente.',
      icon = '<i class="fas fa-exclamation-circle"></i>',
      onRetry = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-error-state';

    const iconEl = document.createElement('div');
    iconEl.className = 'cds-error-state__icon';
    iconEl.innerHTML = icon;
    container.appendChild(iconEl);

    const titleEl = document.createElement('h3');
    titleEl.className = 'cds-error-state__title';
    titleEl.textContent = title;
    container.appendChild(titleEl);

    const descEl = document.createElement('p');
    descEl.className = 'cds-error-state__description';
    descEl.textContent = description;
    container.appendChild(descEl);

    if (typeof onRetry === 'function') {
      const actionEl = document.createElement('div');
      actionEl.className = 'cds-error-state__action';
      actionEl.appendChild(Button.create({
        text: 'Tentar novamente',
        variant: 'primary',
        onClick: onRetry
      }));
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
      .cds-error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: ${t.spacing.xxl} ${t.spacing.lg};
        text-align: center;
        min-height: 320px;
      }

      .cds-error-state__icon {
        font-size: ${t.typography.fontSize['5xl']};
        margin-bottom: ${t.spacing.md};
        color: ${t.colors.error[500]};
      }

      .cds-error-state__title {
        margin: 0 0 ${t.spacing.sm} 0;
        font-size: ${t.typography.fontSize.lg};
        font-weight: ${t.typography.fontWeight.medium};
        color: ${t.colors.neutral[800]};
      }

      .cds-error-state__description {
        margin: 0 0 ${t.spacing.lg} 0;
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[500]};
        max-width: 480px;
      }

      .cds-error-state__action {
        margin-top: ${t.spacing.md};
      }
    `;
  }
}

module.exports = ErrorState;
