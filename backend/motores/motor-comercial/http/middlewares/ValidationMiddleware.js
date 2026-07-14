/**
 * ValidationMiddleware — Valida requisições HTTP.
 *
 * Sprint 2.5: API REST — middleware de validação.
 *
 * @module motores/motor-comercial/http/middlewares/ValidationMiddleware
 */

const HttpResponse = require('../responses/HttpResponse');

class ValidationMiddleware {
  /**
   * Cria middleware de validação.
   * @param {Function} validator - Função de validação
   * @returns {Function}
   */
  static create(validator) {
    return (req, res, next) => {
      const validationResult = validator(req.body);

      if (validationResult && validationResult.errors) {
        const response = HttpResponse.validationError(
          'Dados inválidos',
          validationResult.errors
        );
        return res.status(HttpResponse.getStatusCode(response)).json(HttpResponse.sanitize(response));
      }

      next();
    };
  }

  /**
   * Valida que campos obrigatórios estão presentes.
   * @param {Array<string>} requiredFields - Campos obrigatórios
   * @returns {Function}
   */
  static requireFields(requiredFields) {
    return (req, res, next) => {
      const missing = requiredFields.filter(field => !req.body[field]);

      if (missing.length > 0) {
        const response = HttpResponse.validationError(
          `Campos obrigatórios ausentes: ${missing.join(', ')}`,
          { missing }
        );
        return res.status(HttpResponse.getStatusCode(response)).json(HttpResponse.sanitize(response));
      }

      next();
    };
  }
}

module.exports = ValidationMiddleware;
