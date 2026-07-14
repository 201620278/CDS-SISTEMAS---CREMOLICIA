/**
 * Input — Form Input Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Input.
 *
 * @module frontend/modules/motor-comercial/components/form/Input
 */

class Input {
  /**
   * Creates an input element.
   * @param {Object} options
   * @param {string} [options.type='text'] - Input type
   * @param {string} [options.placeholder] - Placeholder
   * @param {string} [options.value] - Value
   * @param {string} [options.label] - Label
   * @param {boolean} [options.required=false] - Required
   * @param {boolean} [options.disabled=false] - Disabled
   * @param {boolean} [options.readOnly=false] - Read only
   * @param {boolean} [options.error=false] - Error state
   * @param {string} [options.errorMessage] - Error message
   * @param {string} [options.id] - Input id attribute
   * @param {string} [options.name] - Input name attribute
   * @param {Function} [options.onChange] - Change handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      type = 'text',
      placeholder = '',
      value = '',
      label = '',
      id = '',
      name = '',
      required = false,
      disabled = false,
      readOnly = false,
      error = false,
      errorMessage = '',
      onChange = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-input-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'cds-input__label';
      labelEl.textContent = label;
      if (required) {
        const requiredMark = document.createElement('span');
        requiredMark.className = 'cds-input__required';
        requiredMark.textContent = ' *';
        labelEl.appendChild(requiredMark);
      }
      container.appendChild(labelEl);
    }

    const input = document.createElement('input');
    input.type = type;
    input.placeholder = placeholder;
    input.value = value;
    if (id) input.id = id;
    if (name) input.name = name;
    input.disabled = disabled;
    input.readOnly = readOnly;
    input.className = this._getClasses(error);

    if (onChange && !disabled && !readOnly) {
      input.addEventListener('input', (e) => onChange(e.target.value));
    }

    container.appendChild(input);

    if (error && errorMessage) {
      const errorEl = document.createElement('div');
      errorEl.className = 'cds-input__error';
      errorEl.textContent = errorMessage;
      container.appendChild(errorEl);
    }

    return container;
  }

  /**
   * Gets CSS classes for input.
   * @private
   */
  static _getClasses(error) {
    const classes = ['cds-input'];
    if (error) classes.push('cds-input--error');
    return classes.join(' ');
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    return '';
  }
}

module.exports = Input;
