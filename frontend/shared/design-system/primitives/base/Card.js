/**
 * Card — Base Card Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Card.
 *
 * @module frontend/modules/motor-comercial/components/base/Card
 */

const theme = require('../../theme');

class Card {
  /**
   * Creates a card element.
   * @param {Object} options
   * @param {HTMLElement} [options.header] - Header content
   * @param {HTMLElement} [options.body] - Body content
   * @param {HTMLElement} [options.footer] - Footer content
   * @param {boolean} [options.elevated=false] - Elevated shadow
   * @param {boolean} [options.bordered=true] - Show border
   * @param {string} [options.className] - Additional classes
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      header = null,
      body = null,
      footer = null,
      elevated = false,
      bordered = true,
      className = ''
    } = options;

    const card = document.createElement('div');
    card.className = this._getClasses(elevated, bordered, className);

    if (header) {
      const headerEl = document.createElement('div');
      headerEl.className = 'cds-card__header';
      headerEl.appendChild(header);
      card.appendChild(headerEl);
    }

    if (body) {
      const bodyEl = document.createElement('div');
      bodyEl.className = 'cds-card__body';
      bodyEl.appendChild(body);
      card.appendChild(bodyEl);
    }

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'cds-card__footer';
      footerEl.appendChild(footer);
      card.appendChild(footerEl);
    }

    return card;
  }

  /**
   * Gets CSS classes for card.
   * @private
   */
  static _getClasses(elevated, bordered, className) {
    const classes = ['cds-card'];

    if (elevated) classes.push('cds-card--elevated');
    if (bordered) classes.push('cds-card--bordered');
    if (className) classes.push(className);

    return classes.join(' ');
  }

  /**
   * Creates card header.
   * @param {Object} options
   * @param {string} [options.title] - Title
   * @param {string} [options.subtitle] - Subtitle
   * @param {HTMLElement} [options.actions] - Actions
   * @returns {HTMLElement}
   */
  static createHeader(options = {}) {
    const { title = '', subtitle = '', actions = null } = options;

    const header = document.createElement('div');
    header.className = 'cds-card-header';

    if (title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'cds-card-header__title';
      titleEl.textContent = title;
      header.appendChild(titleEl);
    }

    if (subtitle) {
      const subtitleEl = document.createElement('p');
      subtitleEl.className = 'cds-card-header__subtitle';
      subtitleEl.textContent = subtitle;
      header.appendChild(subtitleEl);
    }

    if (actions) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'cds-card-header__actions';
      actionsEl.appendChild(actions);
      header.appendChild(actionsEl);
    }

    return header;
  }

  /**
   * Creates card body.
   * @param {HTMLElement} content - Body content
   * @returns {HTMLElement}
   */
  static createBody(content) {
    const body = document.createElement('div');
    body.className = 'cds-card-body';
    body.appendChild(content);
    return body;
  }

  /**
   * Creates card footer.
   * @param {HTMLElement} content - Footer content
   * @returns {HTMLElement}
   */
  static createFooter(content) {
    const footer = document.createElement('div');
    footer.className = 'cds-card-footer';
    footer.appendChild(content);
    return footer;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-card {
        background-color: ${t.components.card.backgroundColor};
        border-radius: ${t.components.card.radius};
        overflow: hidden;
        transition: box-shadow ${t.animations.duration.normal} ${t.animations.easing.easeInOut};
      }

      .cds-card--bordered {
        border: 1px solid ${t.components.card.borderColor};
      }

      .cds-card--elevated {
        box-shadow: ${t.components.card.shadow};
      }

      .cds-card__header {
        padding: ${t.spacing.md} ${t.spacing.lg};
        border-bottom: 1px solid ${t.colors.neutral[200]};
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cds-card-header__title {
        margin: 0;
        font-size: ${t.typography.fontSize.lg};
        font-weight: ${t.typography.fontWeight.semibold};
        color: ${t.colors.neutral[900]};
      }

      .cds-card-header__subtitle {
        margin: ${t.spacing.xs} 0 0 0;
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[600]};
      }

      .cds-card-header__actions {
        display: flex;
        gap: ${t.spacing.sm};
      }

      .cds-card__body {
        padding: ${t.spacing.lg};
      }

      .cds-card__footer {
        padding: ${t.spacing.md} ${t.spacing.lg};
        border-top: 1px solid ${t.colors.neutral[200]};
        display: flex;
        justify-content: flex-end;
        gap: ${t.spacing.sm};
      }
    `;
  }
}

module.exports = Card;
