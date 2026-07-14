/**
 * CurrencyInput — Form Currency Input Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente CurrencyInput.
 *
 * @module frontend/modules/motor-comercial/components/form/CurrencyInput
 */

const Input = require('./Input');
const theme = require('../../theme');

class CurrencyInput {
  /**
   * Creates a currency input element.
   * @param {Object} options
   * @param {number} [options.value=0] - Value
   * @param {string} [options.currency='BRL'] - Currency code
   * @param {string} [options.label] - Label
   * @param {boolean} [options.disabled=false] - Disabled
   * @param {boolean} [options.readOnly=false] - Read only
   * @param {Function} [options.onChange] - Change handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      value = 0,
      currency = 'BRL',
      label = '',
      disabled = false,
      readOnly = false,
      onChange = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-currency-input-group';

    if (label) {
      const labelEl = document.createElement('label');
      labelEl.className = 'cds-currency-input__label';
      labelEl.textContent = label;
      container.appendChild(labelEl);
    }

    const inputContainer = document.createElement('div');
    inputContainer.className = 'cds-currency-input__container';

    const prefix = document.createElement('span');
    prefix.className = 'cds-currency-input__prefix';
    prefix.textContent = this._getCurrencySymbol(currency);
    inputContainer.appendChild(prefix);

    const input = document.createElement('input');
    input.type = 'text';
    input.value = this._formatCurrency(value);
    input.disabled = disabled;
    input.readOnly = readOnly;
    input.className = 'cds-currency-input';

    if (onChange && !disabled && !readOnly) {
      input.addEventListener('input', (e) => {
        const numericValue = this._parseCurrency(e.target.value);
        onChange(numericValue);
      });

      input.addEventListener('blur', (e) => {
        e.target.value = this._formatCurrency(this._parseCurrency(e.target.value));
      });
    }

    inputContainer.appendChild(input);
    container.appendChild(inputContainer);

    return container;
  }

  /**
   * Gets currency symbol.
   * @private
   */
  static _getCurrencySymbol(currency) {
    const symbols = {
      BRL: 'R$',
      USD: '$',
      EUR: '€'
    };
    return symbols[currency] || currency;
  }

  /**
   * Formats currency value.
   * @private
   */
  static _formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value).replace('R$', '').trim();
  }

  /**
   * Parses currency value.
   * @private
   */
  static _parseCurrency(value) {
    const cleaned = value.replace(/\D/g, '');
    return parseFloat(cleaned) / 100 || 0;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-currency-input-group {
        display: flex;
        flex-direction: column;
        gap: ${t.spacing.xs};
        margin-bottom: ${t.spacing.md};
      }

      .cds-currency-input__label {
        font-size: ${t.typography.fontSize.sm};
        font-weight: ${t.typography.fontWeight.medium};
        color: ${t.colors.neutral[700]};
      }

      .cds-currency-input__container {
        display: flex;
        align-items: center;
        border: 1px solid ${t.components.input.borderColor};
        border-radius: ${t.radius.md};
        overflow: hidden;
        background-color: ${t.components.input.backgroundColor};
      }

      .cds-currency-input__prefix {
        padding: ${t.spacing.sm} ${t.spacing.md};
        background-color: ${t.colors.neutral[100]};
        font-weight: ${t.typography.fontWeight.medium};
        color: ${t.colors.neutral[700]};
      }

      .cds-currency-input {
        flex: 1;
        padding: ${t.spacing.sm} ${t.spacing.md};
        border: none;
        font-size: ${t.typography.fontSize.base};
        font-family: ${t.typography.fontFamily.primary};
        outline: none;
      }

      .cds-currency-input:focus {
        outline: none;
      }

      .cds-currency-input:disabled {
        background-color: ${t.components.input.disabledBackgroundColor};
        cursor: not-allowed;
        opacity: 0.6;
      }
    `;
  }
}

module.exports = CurrencyInput;
