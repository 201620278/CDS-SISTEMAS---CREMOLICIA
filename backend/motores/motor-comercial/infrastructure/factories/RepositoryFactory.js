/**
 * RepositoryFactory — Centraliza criação dos repositories.
 *
 * Sprint 2.2.5: Use Cases nunca instanciam repositories diretamente.
 *
 * @class RepositoryFactory
 */

const PerfilComercialRepository = require('../../repositories/PerfilComercialRepository');
const ConsignacaoRepository = require('../../repositories/ConsignacaoRepository');
const ConsignacaoItemRepository = require('../../repositories/ConsignacaoItemRepository');
const MovimentacaoComercialRepository = require('../../repositories/MovimentacaoComercialRepository');
const MovimentacaoPerfilRepository = require('../../repositories/MovimentacaoPerfilRepository');

class RepositoryFactory {
  /**
   * @param {Object} [deps]
   * @param {Object} [deps.db]
   */
  constructor(deps = {}) {
    this._db = deps.db ?? null;
  }

  /**
   * @param {Object} [overrides]
   * @returns {import('../../repositories/PerfilComercialRepository')}
   */
  criarPerfilComercialRepository(overrides = {}) {
    return new PerfilComercialRepository({ db: overrides.db ?? this._db });
  }

  /**
   * @param {Object} [overrides]
   * @returns {import('../../repositories/ConsignacaoRepository')}
   */
  criarConsignacaoRepository(overrides = {}) {
    return new ConsignacaoRepository({ db: overrides.db ?? this._db });
  }

  /**
   * @param {Object} [overrides]
   * @returns {import('../../repositories/ConsignacaoItemRepository')}
   */
  criarConsignacaoItemRepository(overrides = {}) {
    return new ConsignacaoItemRepository({ db: overrides.db ?? this._db });
  }

  /**
   * @param {Object} [overrides]
   * @returns {import('../../repositories/MovimentacaoComercialRepository')}
   */
  criarMovimentacaoComercialRepository(overrides = {}) {
    return new MovimentacaoComercialRepository({ db: overrides.db ?? this._db });
  }

  /**
   * @param {Object} [overrides]
   * @returns {import('../../repositories/MovimentacaoPerfilRepository')}
   */
  criarMovimentacaoPerfilRepository(overrides = {}) {
    return new MovimentacaoPerfilRepository({ db: overrides.db ?? this._db });
  }

  /**
   * @param {Object} db
   * @returns {RepositoryFactory}
   */
  comDb(db) {
    return new RepositoryFactory({ db });
  }
}

module.exports = RepositoryFactory;
