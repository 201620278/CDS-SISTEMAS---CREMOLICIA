/**
 * RecomendacoesDTO — projeção do Motor de Recomendações.
 *
 * Sprint O-9.
 *
 * @module motores/motor-comercial/dto/RecomendacoesDTO
 */

class RecomendacoesDTO {
  constructor(data = {}) {
    this.resumo = data.resumo || {};
    this.recomendacoes = data.recomendacoes || [];
    this.prioritarias = data.prioritarias || [];
    this.categorias = data.categorias || {};
    this.kpis = data.kpis || {};
  }

  static create(data) {
    return new RecomendacoesDTO(data);
  }

  toJSON() {
    return {
      resumo: this.resumo,
      recomendacoes: this.recomendacoes,
      prioritarias: this.prioritarias,
      categorias: this.categorias,
      kpis: this.kpis
    };
  }
}

module.exports = RecomendacoesDTO;
