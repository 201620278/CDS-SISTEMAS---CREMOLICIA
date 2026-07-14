/**
 * Result — Padrão de retorno para Use Cases.
 *
 * Sprint 2.2.5: infraestrutura — sem regras de negócio.
 *
 * @class Result
 */

class Result {
  /**
   * @param {Object} opcoes
   * @param {boolean} opcoes.sucesso
   * @param {*} [opcoes.dados]
   * @param {Error|Object|null} [opcoes.erro]
   * @param {string[]} [opcoes.mensagens]
   */
  constructor({ sucesso, dados = null, erro = null, mensagens = [] }) {
    this.sucesso = Boolean(sucesso);
    this.dados = dados;
    this.erro = erro;
    this.mensagens = Array.isArray(mensagens) ? mensagens : [];
  }

  /**
   * @param {*} [dados]
   * @param {string[]} [mensagens]
   * @returns {Result}
   */
  static ok(dados = null, mensagens = []) {
    return new Result({ sucesso: true, dados, mensagens });
  }

  /**
   * @param {Error|Object|string} erro
   * @param {string[]} [mensagens]
   * @returns {Result}
   */
  static fail(erro, mensagens = []) {
    const erroNormalizado = erro instanceof Error
      ? erro
      : new Error(typeof erro === 'string' ? erro : 'Operação falhou');

    return new Result({
      sucesso: false,
      erro: erroNormalizado,
      mensagens: Array.isArray(mensagens) ? mensagens : []
    });
  }

  /**
   * @returns {boolean}
   */
  isOk() {
    return this.sucesso;
  }

  /**
   * @returns {boolean}
   */
  isFail() {
    return !this.sucesso;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      sucesso: this.sucesso,
      dados: this.dados,
      erro: this.erro
        ? {
          nome: this.erro.name,
          mensagem: this.erro.message,
          codigo: this.erro.codigo ?? null
        }
        : null,
      mensagens: this.mensagens
    };
  }
}

module.exports = Result;
