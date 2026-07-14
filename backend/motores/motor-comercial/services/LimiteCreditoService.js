/**
 * LimiteCreditoService — fachada legada para CreditoComercialService.
 *
 * @class LimiteCreditoService
 */

const CreditoComercialService = require('./CreditoComercialService');

class LimiteCreditoService {
  /**
   * @param {Object} [deps]
   */
  constructor(deps = {}) {
    this._credito = deps.creditoComercialService || new CreditoComercialService(deps);
  }

  calcular(params) {
    return this._credito.calcular(params);
  }

  calcularParaPerfil(uow, perfilComercialId, options) {
    return this._credito.calcularParaPerfil(uow, perfilComercialId, options);
  }

  podeEntregar(creditoDisponivel, valorEntrega) {
    return CreditoComercialService.podeEntregar(creditoDisponivel, valorEntrega);
  }
}

module.exports = LimiteCreditoService;
