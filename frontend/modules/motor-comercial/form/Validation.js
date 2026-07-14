/**
 * Validation — Form Validation Utilities
 *
 * Sprint 2.7: Arquitetura Frontend — validação de formulário.
 *
 * @module frontend/modules/motor-comercial/form/Validation
 */

class Validation {
  /**
   * Required field validation.
   * @param {string} value - Field value
   * @param {string} [message] - Error message
   * @returns {string|null}
   */
  static required(value, message = 'Campo obrigatório') {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  }

  /**
   * Email validation.
   * @param {string} value - Field value
   * @param {string} [message] - Error message
   * @returns {string|null}
   */
  static email(value, message = 'Email inválido') {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message;
    }
    return null;
  }

  /**
   * Min length validation.
   * @param {number} min - Minimum length
   * @param {string} [message] - Error message
   * @returns {Function}
   */
  static minLength(min, message) {
    return (value) => {
      if (value && value.length < min) {
        return message || `Mínimo de ${min} caracteres`;
      }
      return null;
    };
  }

  /**
   * Max length validation.
   * @param {number} max - Maximum length
   * @param {string} [message] - Error message
   * @returns {Function}
   */
  static maxLength(max, message) {
    return (value) => {
      if (value && value.length > max) {
        return message || `Máximo de ${max} caracteres`;
      }
      return null;
    };
  }

  /**
   * Pattern validation.
   * @param {RegExp} pattern - Regex pattern
   * @param {string} [message] - Error message
   * @returns {Function}
   */
  static pattern(pattern, message) {
    return (value) => {
      if (value && !pattern.test(value)) {
        return message || 'Formato inválido';
      }
      return null;
    };
  }

  /**
   * Number validation.
   * @param {string} value - Field value
   * @param {string} [message] - Error message
   * @returns {string|null}
   */
  static number(value, message = 'Número inválido') {
    if (value && isNaN(Number(value))) {
      return message;
    }
    return null;
  }

  /**
   * Min value validation.
   * @param {number} min - Minimum value
   * @param {string} [message] - Error message
   * @returns {Function}
   */
  static minValue(min, message) {
    return (value) => {
      if (value !== null && value !== undefined && Number(value) < min) {
        return message || `Valor mínimo é ${min}`;
      }
      return null;
    };
  }

  /**
   * Max value validation.
   * @param {number} max - Maximum value
   * @param {string} [message] - Error message
   * @returns {Function}
   */
  static maxValue(max, message) {
    return (value) => {
      if (value !== null && value !== undefined && Number(value) > max) {
        return message || `Valor máximo é ${max}`;
      }
      return null;
    };
  }

  /**
   * Validate field with multiple validators.
   * @param {*} value - Field value
   * @param {Array<Function>} validators - Array of validators
   * @returns {string|null}
   */
  static validate(value, validators) {
    for (const validator of validators) {
      const error = validator(value);
      if (error) {
        return error;
      }
    }
    return null;
  }

  /**
   * Validate entire form.
   * @param {Object} values - Form values
   * @param {Object} schema - Validation schema
   * @returns {Object}
   */
  static validateForm(values, schema) {
    const errors = {};

    for (const [field, validators] of Object.entries(schema)) {
      const error = this.validate(values[field], validators);
      if (error) {
        errors[field] = error;
      }
    }

    return errors;
  }
}

module.exports = Validation;
