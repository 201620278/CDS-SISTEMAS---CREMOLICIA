/**
 * ConsignacaoReadUseCase — Base para consultas da Consignacao.
 *
 * @abstract
 * @class ConsignacaoReadUseCase
 */

const BaseUseCase = require('../base/BaseUseCase');
const { ConsignacaoNaoEncontradaError } = require('../../domain/errors');

class ConsignacaoReadUseCase extends BaseUseCase {
  /**
   * @param {Object} deps
   */
  constructor(deps = {}) {
    super(deps);
    this._consignacaoRepository = deps.consignacaoRepository ?? null;
    this._consignacaoItemRepository = deps.consignacaoItemRepository ?? null;
  }

  /**
   * @param {number|string} consignacaoId
   * @returns {Promise<Object>}
   */
  async _obterConsignacaoOuFalhar(consignacaoId) {
    const consignacao = await this._consignacaoRepository.buscarPorId(consignacaoId);
    if (!consignacao) {
      throw new ConsignacaoNaoEncontradaError(consignacaoId);
    }
    return consignacao;
  }
}

module.exports = ConsignacaoReadUseCase;
