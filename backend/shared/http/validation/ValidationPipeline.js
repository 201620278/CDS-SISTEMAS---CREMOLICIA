/**
 * ValidationPipeline — Pipeline de validação HTTP.
 *
 * Sprint 2.5.5: Hardening da API — pipeline de validação HTTP.
 *
 * @module backend/shared/http/validation/ValidationPipeline
 */

const StandardResponse = require('../responses/StandardResponse');

class ValidationPipeline {
  /**
   * Cria um pipeline de validação.
   * @returns {ValidationPipeline}
   */
  static create() {
    return new ValidationPipeline();
  }

  constructor() {
    this._validators = [];
  }

  /**
   * Adiciona um validador ao pipeline.
   * @param {Function} validator - Função de validação
   * @returns {ValidationPipeline}
   */
  add(validator) {
    this._validators.push(validator);
    return this;
  }

  /**
   * Adiciona validação de campos obrigatórios.
   * @param {Array<string>} fields - Campos obrigatórios
   * @returns {ValidationPipeline}
   */
  required(fields) {
    this._validators.push((data) => {
      const errors = [];
      for (const field of fields) {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push({
            field,
            message: `${field} é obrigatório`,
            code: 'REQUIRED'
          });
        }
      }
      return errors.length > 0 ? errors : null;
    });
    return this;
  }

  /**
   * Adiciona validação de tipo.
   * @param {string} field - Campo a validar
   * @param {string} type - Tipo esperado (string, number, boolean, date, email)
   * @returns {ValidationPipeline}
   */
  type(field, type) {
    this._validators.push((data) => {
      const value = data[field];
      if (value === undefined || value === null) {
        return null;
      }

      const errors = [];

      switch (type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({
              field,
              message: `${field} deve ser uma string`,
              code: 'INVALID_TYPE'
            });
          }
          break;
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push({
              field,
              message: `${field} deve ser um número`,
              code: 'INVALID_TYPE'
            });
          }
          break;
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push({
              field,
              message: `${field} deve ser um booleano`,
              code: 'INVALID_TYPE'
            });
          }
          break;
        case 'date':
          if (!(value instanceof Date) && isNaN(Date.parse(value))) {
            errors.push({
              field,
              message: `${field} deve ser uma data válida`,
              code: 'INVALID_TYPE'
            });
          }
          break;
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push({
              field,
              message: `${field} deve ser um email válido`,
              code: 'INVALID_TYPE'
            });
          }
          break;
        default:
          errors.push({
            field,
            message: `Tipo ${type} não suportado`,
            code: 'INVALID_TYPE'
          });
      }

      return errors.length > 0 ? errors : null;
    });
    return this;
  }

  /**
   * Adiciona validação de tamanho (string ou array).
   * @param {string} field - Campo a validar
   * @param {Object} options - Opções de tamanho
   * @param {number} [options.min] - Tamanho mínimo
   * @param {number} [options.max] - Tamanho máximo
   * @returns {ValidationPipeline}
   */
  length(field, options = {}) {
    this._validators.push((data) => {
      const value = data[field];
      if (value === undefined || value === null) {
        return null;
      }

      const errors = [];
      const length = value.length;

      if (options.min !== undefined && length < options.min) {
        errors.push({
          field,
          message: `${field} deve ter no mínimo ${options.min} caracteres`,
          code: 'MIN_LENGTH'
        });
      }

      if (options.max !== undefined && length > options.max) {
        errors.push({
          field,
          message: `${field} deve ter no máximo ${options.max} caracteres`,
          code: 'MAX_LENGTH'
        });
      }

      return errors.length > 0 ? errors : null;
    });
    return this;
  }

  /**
   * Adiciona validação de intervalo (número).
   * @param {string} field - Campo a validar
   * @param {Object} options - Opções de intervalo
   * @param {number} [options.min] - Valor mínimo
   * @param {number} [options.max] - Valor máximo
   * @returns {ValidationPipeline}
   */
  range(field, options = {}) {
    this._validators.push((data) => {
      const value = data[field];
      if (value === undefined || value === null) {
        return null;
      }

      const errors = [];

      if (options.min !== undefined && value < options.min) {
        errors.push({
          field,
          message: `${field} deve ser maior ou igual a ${options.min}`,
          code: 'MIN_VALUE'
        });
      }

      if (options.max !== undefined && value > options.max) {
        errors.push({
          field,
          message: `${field} deve ser menor ou igual a ${options.max}`,
          code: 'MAX_VALUE'
        });
      }

      return errors.length > 0 ? errors : null;
    });
    return this;
  }

  /**
   * Adiciona validação de enum.
   * @param {string} field - Campo a validar
   * @param {Array} values - Valores permitidos
   * @returns {ValidationPipeline}
   */
  enum(field, values) {
    this._validators.push((data) => {
      const value = data[field];
      if (value === undefined || value === null) {
        return null;
      }

      if (!values.includes(value)) {
        return [{
          field,
          message: `${field} deve ser um dos seguintes valores: ${values.join(', ')}`,
          code: 'INVALID_ENUM',
          allowedValues: values
        }];
      }

      return null;
    });
    return this;
  }

  /**
   * Adiciona validação de padrão (regex).
   * @param {string} field - Campo a validar
   * @param {RegExp} pattern - Padrão regex
   * @param {string} [message] - Mensagem de erro customizada
   * @returns {ValidationPipeline}
   */
  pattern(field, pattern, message) {
    this._validators.push((data) => {
      const value = data[field];
      if (value === undefined || value === null) {
        return null;
      }

      if (!pattern.test(value)) {
        return [{
          field,
          message: message || `${field} não corresponde ao padrão esperado`,
          code: 'INVALID_PATTERN'
        }];
      }

      return null;
    });
    return this;
  }

  /**
   * Adiciona validação customizada.
   * @param {Function} validator - Função de validação customizada
   * @returns {ValidationPipeline}
   */
  custom(validator) {
    this._validators.push(validator);
    return this;
  }

  /**
   * Executa o pipeline de validação.
   * @param {Object} data - Dados a validar
   * @returns {Object|null} - Erros de validação ou null
   */
  validate(data) {
    const allErrors = [];

    for (const validator of this._validators) {
      const errors = validator(data);
      if (errors) {
        if (Array.isArray(errors)) {
          allErrors.push(...errors);
        } else {
          allErrors.push(errors);
        }
      }
    }

    return allErrors.length > 0 ? allErrors : null;
  }

  /**
   * Executa o pipeline e retorna resposta de erro se houver falha.
   * @param {Object} data - Dados a validar
   * @param {Object} req - Objeto da requisição Express
   * @param {Object} res - Objeto da resposta Express
   * @returns {boolean} - true se válido, false se inválido (resposta enviada)
   */
  validateOrRespond(data, req, res) {
    const errors = this.validate(data);

    if (errors) {
      const response = StandardResponse.validationError('Dados inválidos', errors);
      const enriched = StandardResponse.enrich(response, req);
      res.status(StandardResponse.getStatusCode(response)).json(enriched);
      return false;
    }

    return true;
  }

  /**
   * Cria middleware Express a partir do pipeline.
   * @param {string} [source='body'] - Fonte dos dados (body, query, params)
   * @returns {Function}
   */
  middleware(source = 'body') {
    return (req, res, next) => {
      const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;

      if (this.validateOrRespond(data, req, res)) {
        next();
      }
    };
  }

  /**
   * Limpa todos os validadores do pipeline.
   * @returns {ValidationPipeline}
   */
  clear() {
    this._validators = [];
    return this;
  }
}

module.exports = ValidationPipeline;
