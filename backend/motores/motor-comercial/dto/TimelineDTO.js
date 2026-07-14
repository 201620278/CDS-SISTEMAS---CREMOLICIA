/**
 * TimelineDTO — Projeção cronológica de eventos comerciais.
 *
 * @class TimelineDTO
 */

class TimelineDTO {
  /**
   * @param {Object} [dados]
   */
  constructor(dados = {}) {
    this.consignacaoId = dados.consignacaoId ?? null;
    this.eventos = dados.eventos ?? [];
  }

  /**
   * @param {Object|null|undefined} plain
   * @returns {TimelineDTO}
   */
  static create(plain) {
    return new TimelineDTO(plain || {});
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return {
      consignacaoId: this.consignacaoId,
      eventos: this.eventos
    };
  }
}

module.exports = TimelineDTO;
