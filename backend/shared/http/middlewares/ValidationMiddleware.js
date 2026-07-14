/**
 * ValidationMiddleware — Valida requisições HTTP (versão corporativa).
 *
 * Sprint 2.5.5: Hardening da API — middleware aprimorado.
 *
 * @module backend/shared/http/middlewares/ValidationMiddleware
 */

const StandardResponse = require('../responses/StandardResponse');

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
        const response = StandardResponse.validationError(
          'Dados inválidos',
          validationResult.errors
        );
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
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
        const response = StandardResponse.validationError(
          `Campos obrigatórios ausentes: ${missing.join(', ')}`,
          { missing }
        );
        const enriched = StandardResponse.enrich(response, req);
        return res.status(StandardResponse.getStatusCode(response)).json(enriched);
      }

      next();
    };
  }
}

module.exports = ValidationMiddleware;
