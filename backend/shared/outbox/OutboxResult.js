/**
 * OutboxResult — Resultado padronizado de dispatch Outbox.
 *
 * @module backend/shared/outbox/OutboxResult
 */

class OutboxResult {
  /**
   * @param {boolean} sucesso
   * @param {*} [dados]
   * @param {Error|string|null} [erro]
   * @param {Object} [meta]
   */
  constructor(sucesso, dados = null, erro = null, meta = {}) {
    this.sucesso = sucesso;
    this.dados = dados;
    this.erro = erro;
    this.meta = meta;
  }

  /**
   * @param {*} dados
   * @param {Object} [meta]
   * @returns {OutboxResult}
   */
  static ok(dados = null, meta = {}) {
    return new OutboxResult(true, dados, null, meta);
  }

  /**
   * @param {Error|string} erro
   * @param {Object} [meta]
   * @returns {OutboxResult}
   */
  static fail(erro, meta = {}) {
    return new OutboxResult(false, null, erro, meta);
  }

  /**
   * @returns {boolean}
   */
  isOk() {
    return this.sucesso === true;
  }
}

module.exports = OutboxResult;
