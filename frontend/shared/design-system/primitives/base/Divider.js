/**
 * Divider — Base Divider Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Divider.
 *
 * @module frontend/modules/motor-comercial/components/base/Divider
 */

const theme = require('../../theme');

class Divider {
  /**
   * Creates a divider element.
   * @param {Object} options
   * @param {string} [options.orientation='horizontal'] - Orientation (horizontal, vertical)
   * @param {boolean} [options.label=false] - Has label
   * @param {string} [options.text] - Label text
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      orientation = 'horizontal',
      label = false,
      text = ''
    } = options;

    const divider = document.createElement('div');
    divider.className = this._getClasses(orientation);

    if (label && text) {
      const labelEl = document.createElement('span');
      labelEl.className = 'cds-divider__label';
      labelEl.textContent = text;
      divider.appendChild(labelEl);
    }

    return divider;
  }

  /**
   * Gets CSS classes for divider.
   * @private
   */
  static _getClasses(orientation) {
    return `cds-divider cds-divider--${orientation}`;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-divider {
        border: none;
        display: flex;
        align-items: center;
      }

      .cds-divider--horizontal {
        width: 100%;
        height: 1px;
        background-color: ${t.colors.neutral[200]};
        margin: ${t.spacing.lg} 0;
      }

      .cds-divider--vertical {
        width: 1px;
        height: 100%;
        background-color: ${t.colors.neutral[200]};
        margin: 0 ${t.spacing.lg};
      }

      .cds-divider__label {
        padding: 0 ${t.spacing.md};
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[500]};
        background-color: ${t.colors.neutral[50]};
      }
    `;
  }
}

module.exports = Divider;
