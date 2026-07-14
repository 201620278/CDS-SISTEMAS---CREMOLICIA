/**
 * PendenciasDTO — projeção da Central de Pendências e Alertas.
 *
 * Sprint O-8.
 *
 * @module motores/motor-comercial/dto/PendenciasDTO
 */

class PendenciasDTO {
  constructor(data = {}) {
    this.resumo = data.resumo || {};
    this.criticas = data.criticas || [];
    this.importantes = data.importantes || [];
    this.informativas = data.informativas || [];
    this.alertas = data.alertas || [];
    this.proximasAcoes = data.proximasAcoes || [];
    this.categorias = data.categorias || {};
  }

  static create(data) {
    return new PendenciasDTO(data);
  }

  toJSON() {
    return {
      resumo: this.resumo,
      criticas: this.criticas,
      importantes: this.importantes,
      informativas: this.informativas,
      alertas: this.alertas,
      proximasAcoes: this.proximasAcoes,
      categorias: this.categorias
    };
  }
}

module.exports = PendenciasDTO;
