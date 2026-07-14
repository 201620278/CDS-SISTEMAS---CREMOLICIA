/**
 * RequireMotorInicializadoMiddleware — Bloqueia requisições antes do bootstrap completo.
 *
 * Sprint S-4.1
 *
 * @module motores/motor-comercial/http/middlewares/RequireMotorInicializadoMiddleware
 */

const StandardResponse = require('../../../../shared/http/responses/StandardResponse');

class RequireMotorInicializadoMiddleware {
  static create() {
    return (req, res, next) => {
      const motor = require('../../index');
      if (typeof motor.estaInicializado === 'function' && motor.estaInicializado()) {
        return next();
      }

      const response = StandardResponse.error(
        'MOTOR_NAO_INICIALIZADO',
        'Motor Comercial ainda não foi inicializado. Aguarde o bootstrap do servidor.',
        null,
        503
      );
      const enriched = StandardResponse.enrich(response, req);
      return res.status(StandardResponse.getStatusCode(response)).json(enriched);
    };
  }
}

module.exports = RequireMotorInicializadoMiddleware;
