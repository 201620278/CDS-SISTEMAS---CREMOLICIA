/**
 * Checkbox — Form Checkbox Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Checkbox.
 *
 * @module frontend/modules/motor-comercial/components/form/Checkbox
 */

const theme = require('../../theme');

class Checkbox {
  /**
   * Creates a checkbox element.
   * @param {Object} options
   * @param {string} options.label - Label
   * @param {boolean} [options.checked=false] - Checked state
   * @param {boolean} [options.disabled=false] - Disabled
   * @param {boolean} [options.indeterminate=false] - Indeterminate state
   * @param {Function} [options.onChange] - Change handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      label = '',
      checked = false,
      disabled = false,
      indeterminate = false,
      onChange = null
    } = options;

    const container = document.createElement('label');
    container.className = 'cds-checkbox';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.disabled = disabled;
    input.className = 'cds-checkbox__input';

    if (indeterminate) {
      input.indeterminate = true;
    }

    if (onChange && !disabled) {
      input.addEventListener('change', (e) => onChange(e.target.checked));
    }

    const checkmark = document.createElement('span');
    checkmark.className = 'cds-checkbox__checkmark';

    const labelEl = document.createElement('span');
    labelEl.className = 'cds-checkbox__label';
    labelEl.textContent = label;

    container.appendChild(input);
    container.appendChild(checkmark);
    container.appendChild(labelEl);

    return container;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-checkbox {
        display: inline-flex;
        align-items: center;
        gap: ${t.spacing.sm};
        cursor: pointer;
        user-select: none;
      }

      .cds-checkbox__input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .cds-checkbox__checkmark {
        width: 20px;
        height: 20px;
        border: 2px solid ${t.components.input.borderColor};
        border-radius: ${t.radius.sm};
        background-color: ${t.components.input.backgroundColor};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-checkbox__input:checked + .cds-checkbox__checkmark {
        background-color: ${t.colors.primary[600]};
        border-color: ${t.colors.primary[600]};
      }

      .cds-checkbox__input:checked + .cds-checkbox__checkmark::after {
        content: '✓';
        color: var(--color-action-text);
        font-size: 12px;
        font-weight: bold;
      }

      .cds-checkbox__input:indeterminate + .cds-checkbox__checkmark {
        background-color: ${t.colors.primary[600]};
        border-color: ${t.colors.primary[600]};
      }

      .cds-checkbox__input:indeterminate + .cds-checkbox__checkmark::after {
        content: '−';
        color: var(--color-action-text);
        font-size: 14px;
        font-weight: bold;
      }

      .cds-checkbox__input:disabled + .cds-checkbox__checkmark {
        background-color: ${t.components.input.disabledBackgroundColor};
        border-color: ${t.colors.neutral[300]};
        cursor: not-allowed;
      }

      .cds-checkbox__label {
        font-size: ${t.typography.fontSize.base};
        color: ${t.colors.neutral[700]};
      }

      .cds-checkbox__input:disabled ~ .cds-checkbox__label {
        opacity: 0.6;
      }
    `;
  }
}

module.exports = Checkbox;
