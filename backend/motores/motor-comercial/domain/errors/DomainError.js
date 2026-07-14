/**
 * DomainError — Erro base do domínio comercial.
 *
 * Sprint 2.2.5: infraestrutura — sem regras de negócio.
 *
 * @class DomainError
 * @extends Error
 */

class DomainError extends Error {
  /**
   * @param {string} message
   * @param {Object} [opcoes]
   * @param {string} [opcoes.codigo]
   * @param {Object} [opcoes.detalhes]
   * @param {Error} [opcoes.causa]
   */
  constructor(message, opcoes = {}) {
    super(message);
    this.name = this.constructor.name;
    this.codigo = opcoes.codigo ?? this.constructor.CODIGO ?? 'DOMAIN_ERROR';
    this.detalhes = opcoes.detalhes ?? null;
    this.causa = opcoes.causa ?? null;
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      nome: this.name,
      codigo: this.codigo,
      mensagem: this.message,
      detalhes: this.detalhes
    };
  }
}

module.exports = DomainError;
