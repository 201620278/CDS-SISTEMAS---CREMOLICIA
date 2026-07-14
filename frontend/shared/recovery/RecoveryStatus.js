/**
 * CDS Recovery Framework — Status oficiais de operação
 *
 * @module frontend/shared/recovery/RecoveryStatus
 */

const RecoveryStatus = Object.freeze({
  NOVO: 'NOVO',
  RASCUNHO: 'RASCUNHO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  AGUARDANDO_CONFIRMACAO: 'AGUARDANDO_CONFIRMACAO',
  AGUARDANDO_IMPRESSAO: 'AGUARDANDO_IMPRESSAO',
  AGUARDANDO_ASSINATURA: 'AGUARDANDO_ASSINATURA',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO'
});

const ACTIVE_STATUSES = Object.freeze([
  RecoveryStatus.NOVO,
  RecoveryStatus.RASCUNHO,
  RecoveryStatus.EM_ANDAMENTO,
  RecoveryStatus.AGUARDANDO_CONFIRMACAO,
  RecoveryStatus.AGUARDANDO_IMPRESSAO,
  RecoveryStatus.AGUARDANDO_ASSINATURA
]);

const TERMINAL_STATUSES = Object.freeze([
  RecoveryStatus.CONCLUIDO,
  RecoveryStatus.CANCELADO
]);

function isActiveStatus(status) {
  return ACTIVE_STATUSES.includes(status);
}

function isTerminalStatus(status) {
  return TERMINAL_STATUSES.includes(status);
}

function isValidStatus(status) {
  return Object.values(RecoveryStatus).includes(status);
}

module.exports = {
  RecoveryStatus,
  ACTIVE_STATUSES,
  TERMINAL_STATUSES,
  isActiveStatus,
  isTerminalStatus,
  isValidStatus
};
