/**
 * Textarea — Form Textarea Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Textarea.
 *
 * @module frontend/modules/motor-comercial/components/form/Textarea
 */

class Textarea {
  /**
   * Creates a textarea element.
   * @param {Object} options
   * @param {string} [options.placeholder] - Placeholder
   * @param {string} [options.value] - Value
   * @param {string} [options.label] - Label
   * @param {number} [options.rows=4] - Number of rows
   * @param {boolean} [options.required=false] - Required
   * @param {boolean} [options.disabled=false] - Disabled
   * @param {boolean} [options.readOnly=false] - Read only
   * @param {boolean} [options.error=false] - Error state
   * @param {string} [options.errorMessage] - Error message
   * @param {Function} [options.onChange] - Change handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      placeholder = '',
      value = '',
      label = '',
      rows = 4,
      required = false,
      disabled = false,
      readOnly = false,
      error = false,
      errorMessage = '',
      onChange = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-textarea-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'cds-textarea__label';
      labelEl.textContent = label;
      if (required) {
        const requiredMark = document.createElement('span');
        requiredMark.className = 'cds-textarea__required';
        requiredMark.textContent = ' *';
        labelEl.appendChild(requiredMark);
      }
      container.appendChild(labelEl);
    }

    const textarea = document.createElement('textarea');
    textarea.placeholder = placeholder;
    textarea.value = value;
    textarea.rows = rows;
    textarea.disabled = disabled;
    textarea.readOnly = readOnly;
    textarea.className = this._getClasses(error);

    if (onChange && !disabled && !readOnly) {
      textarea.addEventListener('input', (e) => onChange(e.target.value));
    }

    container.appendChild(textarea);

    if (error && errorMessage) {
      const errorEl = document.createElement('div');
      errorEl.className = 'cds-textarea__error';
      errorEl.textContent = errorMessage;
      container.appendChild(errorEl);
    }

    return container;
  }

  /**
   * Gets CSS classes for textarea.
   * @private
   */
  static _getClasses(error) {
    const classes = ['cds-textarea'];
    if (error) classes.push('cds-textarea--error');
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

module.exports = Textarea;
