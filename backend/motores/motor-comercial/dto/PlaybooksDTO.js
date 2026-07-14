/**
 * PlaybooksDTO — projeção da Central de Playbooks.
 *
 * Sprint O-10.
 *
 * @module motores/motor-comercial/dto/PlaybooksDTO
 */

class PlaybooksDTO {
  constructor(data = {}) {
    this.resumo = data.resumo || {};
    this.playbooks = data.playbooks || [];
    this.sugeridos = data.sugeridos || [];
    this.categorias = data.categorias || {};
    this.kpis = data.kpis || {};
  }

  static create(data) {
    return new PlaybooksDTO(data);
  }

  toJSON() {
    return {
      resumo: this.resumo,
      playbooks: this.playbooks,
      sugeridos: this.sugeridos,
      categorias: this.categorias,
      kpis: this.kpis
    };
  }
}

module.exports = PlaybooksDTO;
