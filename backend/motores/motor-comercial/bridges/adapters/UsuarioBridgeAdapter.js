/**
 * UsuarioBridgeAdapter — Implementa IUsuarioBridge via plataforma CDS.
 *
 * Sprint O-13
 *
 * @module motores/motor-comercial/bridges/adapters/UsuarioBridgeAdapter
 */

const IUsuarioBridge = require('../../domain/contracts/bridges/IUsuarioBridge');

class UsuarioBridgeAdapter extends IUsuarioBridge {
  /**
   * @param {Object} deps
   * @param {import('../platform/UsuarioPlatformGateway')} deps.platform
   */
  constructor(deps = {}) {
    super();
    this._platform = deps.platform;
  }

  /** @inheritdoc */
  async buscarPorId(usuarioId) {
    return this._platform.buscarPorId(usuarioId);
  }

  /** @inheritdoc */
  async possuiPermissao(usuarioId, permissao) {
    return this._platform.possuiPermissao(usuarioId, permissao);
  }
}

module.exports = UsuarioBridgeAdapter;
