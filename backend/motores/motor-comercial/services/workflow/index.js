/**
 * Workflow — Sprint O-11.
 *
 * @module motores/motor-comercial/services/workflow
 */

const { WorkflowService, buildWorkflowId, calcularSla, COLUNAS } = require('./WorkflowService');

function criarWorkflowService() {
  return new WorkflowService();
}

module.exports = {
  WorkflowService,
  criarWorkflowService,
  buildWorkflowId,
  calcularSla,
  COLUNAS
};
