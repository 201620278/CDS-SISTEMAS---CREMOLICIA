/**
 * Select — Form Select Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Select.
 *
 * @module frontend/modules/motor-comercial/components/form/Select
 */

const theme = require('../../theme');

class Select {
  /**
   * Creates a select element.
   * @param {Object} options
   * @param {Array} options.options - Select options
   * @param {string} [options.placeholder] - Placeholder
   * @param {string} [options.value] - Selected value
   * @param {string} [options.label] - Label
   * @param {boolean} [options.required=false] - Required
   * @param {boolean} [options.disabled=false] - Disabled
   * @param {boolean} [options.error=false] - Error state
   * @param {string} [options.errorMessage] - Error message
   * @param {Function} [options.onChange] - Change handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      options: selectOptions = [],
      placeholder = 'Selecione...',
      value = '',
      label = '',
      required = false,
      disabled = false,
      error = false,
      errorMessage = '',
      onChange = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-select-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'cds-select__label';
      labelEl.textContent = label;
      if (required) {
        const requiredMark = document.createElement('span');
        requiredMark.className = 'cds-select__required';
        requiredMark.textContent = ' *';
        labelEl.appendChild(requiredMark);
      }
      container.appendChild(labelEl);
    }

    const select = document.createElement('select');
    select.className = this._getClasses(error);
    select.disabled = disabled;

    if (placeholder) {
      const placeholderOption = document.createElement('option');
      placeholderOption.value = '';
      placeholderOption.textContent = placeholder;
      placeholderOption.disabled = true;
      placeholderOption.selected = !value;
      select.appendChild(placeholderOption);
    }

    selectOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      option.selected = opt.value === value;
      select.appendChild(option);
    });

    if (onChange && !disabled) {
      select.addEventListener('change', (e) => onChange(e.target.value));
    }

    container.appendChild(select);

    if (error && errorMessage) {
      const errorEl = document.createElement('div');
      errorEl.className = 'cds-select__error';
      errorEl.textContent = errorMessage;
      container.appendChild(errorEl);
    }

    return container;
  }

  /**
   * Gets CSS classes for select.
   * @private
   */
  static _getClasses(error) {
    const classes = ['cds-select'];
    if (error) classes.push('cds-select--error');
    return classes.join(' ');
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-select-group {
        display: flex;
        flex-direction: column;
        gap: ${t.spacing.xs};
        margin-bottom: ${t.spacing.md};
      }

      .cds-select__label {
        font-size: ${t.typography.fontSize.sm};
        font-weight: ${t.typography.fontWeight.medium};
        color: ${t.colors.neutral[700]};
      }

      .cds-select__required {
        color: ${t.colors.error[600]};
      }

      .cds-select {
        width: 100%;
        padding: ${t.spacing.sm} ${t.spacing.md};
        border: 1px solid ${t.components.input.borderColor};
        border-radius: ${t.radius.md};
        font-size: ${t.typography.fontSize.base};
        font-family: ${t.typography.fontFamily.primary};
        background-color: ${t.components.input.backgroundColor};
        cursor: pointer;
        transition: border-color ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right ${t.spacing.md} center;
        background-size: 16px;
      }

      .cds-select:focus {
        outline: none;
        border-color: ${t.components.input.focusBorderColor};
        box-shadow: 0 0 0 3px ${t.colors.primary[100]};
      }

      .cds-select--error {
        border-color: ${t.components.input.errorBorderColor};
      }

      .cds-select--error:focus {
        border-color: ${t.components.input.errorBorderColor};
        box-shadow: 0 0 0 3px ${t.colors.error[100]};
      }

      .cds-select:disabled {
        background-color: ${t.components.input.disabledBackgroundColor};
        cursor: not-allowed;
        opacity: 0.6;
      }

      .cds-select__error {
        font-size: ${t.typography.fontSize.xs};
        color: ${t.colors.error[600]};
      }
    `;
  }
}

module.exports = Select;
