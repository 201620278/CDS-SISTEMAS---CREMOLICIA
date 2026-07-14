/**
 * AutorizacaoGerencialController — STAB-01.3
 *
 * @module motores/motor-comercial/controllers/AutorizacaoGerencialController
 */

const {
  registrarAutorizacaoGerencialLimite
} = require('../services/autorizacaoGerencialService');
const StandardResponse = require('../../../shared/http/responses/StandardResponse');

class AutorizacaoGerencialController {
  /**
   * POST /autorizacoes/gerenciais
   * Registra autorização gerencial (ex.: ultrapassar limite comercial).
   */
  async registrar(req, res, next) {
    try {
      const result = await registrarAutorizacaoGerencialLimite(req.body || {}, req);
      const response = {
        success: true,
        data: result
      };
      const enriched = StandardResponse.enrich(response, req);
      return res.status(201).json(enriched);
    } catch (error) {
      if (error.status) {
        return res.status(error.status).json({
          success: false,
          error: { message: error.message }
        });
      }
      next(error);
    }
  }
}

module.exports = AutorizacaoGerencialController;
