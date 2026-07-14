/**
 * PerfilReadUseCase — Base para consultas do PerfilComercial.
 *
 * @abstract
 * @class PerfilReadUseCase
 * @extends BaseUseCase
 */

const BaseUseCase = require('../base/BaseUseCase');
const { PerfilNaoEncontradoError } = require('../../domain/errors');

class PerfilReadUseCase extends BaseUseCase {
  /**
   * @param {Object} deps
   */
  constructor(deps = {}) {
    super(deps);
    this._perfilRepository = deps.perfilComercialRepository ?? null;
    this._movimentacaoPerfilRepository = deps.movimentacaoPerfilRepository ?? null;
  }

  /**
   * @param {number|string} perfilId
   * @returns {Promise<Object>}
   */
  async _obterPerfilOuFalhar(perfilId) {
    const perfil = await this._perfilRepository.buscarPorId(perfilId);
    if (!perfil) {
      throw new PerfilNaoEncontradoError(perfilId);
    }
    return perfil;
  }
}

module.exports = PerfilReadUseCase;
