/**
 * Operações de recovery do Motor Comercial
 *
 * @module frontend/modules/motor-comercial/recovery/operations
 */

const MODULE_ID = 'motor-comercial';

const Operations = Object.freeze({
  PREPARAR_ENTREGA: 'PREPARAR_ENTREGA',
  ENTREGA: 'ENTREGA',
  FECHAR_ATENDIMENTO: 'FECHAR_ATENDIMENTO'
});

const ALL_OPERATIONS = Object.freeze([
  Operations.PREPARAR_ENTREGA,
  Operations.ENTREGA,
  Operations.FECHAR_ATENDIMENTO
]);

module.exports = {
  MODULE_ID,
  Operations,
  ALL_OPERATIONS
};
