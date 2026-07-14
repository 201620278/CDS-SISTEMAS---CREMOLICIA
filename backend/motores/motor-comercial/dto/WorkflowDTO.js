/**
 * WorkflowDTO — projeção da Central de Workflow Operacional.
 *
 * Sprint O-11.
 *
 * @module motores/motor-comercial/dto/WorkflowDTO
 */

class WorkflowDTO {
  constructor(data = {}) {
    this.resumo = data.resumo || {};
    this.fila = data.fila || [];
    this.workflows = data.workflows || [];
    this.kanban = data.kanban || {};
    this.sla = data.sla || {};
    this.distribuicao = data.distribuicao || [];
    this.timeline = data.timeline || [];
    this.historico = data.historico || [];
  }

  static create(data) {
    return new WorkflowDTO(data);
  }

  toJSON() {
    return {
      resumo: this.resumo,
      fila: this.fila,
      workflows: this.workflows,
      kanban: this.kanban,
      sla: this.sla,
      distribuicao: this.distribuicao,
      timeline: this.timeline,
      historico: this.historico
    };
  }
}

module.exports = WorkflowDTO;
