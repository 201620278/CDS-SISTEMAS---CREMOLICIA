/**
 * UC-018 — ValidarEntregaConsignacaoUseCase
 *
 * @class ValidarEntregaConsignacaoUseCase
 */

const ConsignacaoReadUseCase = require('./ConsignacaoReadUseCase');
const { DocumentoInvalidoError } = require('../../domain/errors');
const { executarValidacaoEntrega } = require('./consignacaoOperacaoHelpers');

class ValidarEntregaConsignacaoUseCase extends ConsignacaoReadUseCase {
  constructor(deps = {}) {
    super(deps);
    this._clienteBridge = deps.clienteBridge ?? null;
    this._perfilComercialRepository = deps.perfilComercialRepository ?? null;
  }

  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
  }

  async processar(entrada) {
    return executarValidacaoEntrega({
      consignacaoRepository: this._consignacaoRepository,
      consignacaoItemRepository: this._consignacaoItemRepository,
      clienteBridge: this._clienteBridge,
      perfilComercialRepository: this._perfilComercialRepository,
      movimentacaoComercialRepository: this._movimentacaoComercialRepository
    }, entrada.consignacaoId);
  }
}

module.exports = ValidarEntregaConsignacaoUseCase;
