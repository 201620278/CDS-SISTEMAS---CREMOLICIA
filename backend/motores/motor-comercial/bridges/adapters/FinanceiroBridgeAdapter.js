/**
 * FinanceiroBridgeAdapter — Implementa IFinanceiroBridge via plataforma CDS.
 *
 * Sprint O-13
 *
 * @module motores/motor-comercial/bridges/adapters/FinanceiroBridgeAdapter
 */

const IFinanceiroBridge = require('../../domain/contracts/bridges/IFinanceiroBridge');

class FinanceiroBridgeAdapter extends IFinanceiroBridge {
  /**
   * @param {Object} deps
   * @param {import('../platform/FinanceiroPlatformGateway')} deps.platform
   */
  constructor(deps = {}) {
    super();
    this._platform = deps.platform;
  }

  /** @inheritdoc */
  async registrarRecebimento(dados) {
    return this._platform.registrarRecebimento(dados);
  }

  /** @inheritdoc */
  async registrarReceitaConsignacao(dados) {
    return this._platform.registrarReceitaConsignacao(dados);
  }

  /** @inheritdoc */
  async registrarPerda(dados) {
    return this._platform.registrarPerda(dados);
  }

  /** @inheritdoc */
  async registrarTitulo(dados) {
    return this._platform.registrarRecebimento({
      ...dados,
      valor: dados.valor ?? dados.valorTitulo
    });
  }

  /** @inheritdoc */
  async estornarLancamento(_dados) {
    return { estornado: false, motivo: 'Estorno financeiro requer operação manual na plataforma CDS' };
  }
}

module.exports = FinanceiroBridgeAdapter;
