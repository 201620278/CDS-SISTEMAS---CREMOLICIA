/**
 * ClienteBridgeAdapter — Implementa IClienteBridge via plataforma CDS.
 *
 * Sprint O-13
 *
 * @module motores/motor-comercial/bridges/adapters/ClienteBridgeAdapter
 */

const IClienteBridge = require('../../domain/contracts/bridges/IClienteBridge');

class ClienteBridgeAdapter extends IClienteBridge {
  /**
   * @param {Object} deps
   * @param {import('../platform/ClientePlatformGateway')} deps.platform
   */
  constructor(deps = {}) {
    super();
    this._platform = deps.platform;
  }

  /** @inheritdoc */
  async buscarPorId(clienteId) {
    return this._platform.buscarPorId(clienteId);
  }

  /** @inheritdoc */
  async estaAtivo(clienteId) {
    return this._platform.estaAtivo(clienteId);
  }
}

module.exports = ClienteBridgeAdapter;
