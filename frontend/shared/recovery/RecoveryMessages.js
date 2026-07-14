/**
 * CDS Recovery Framework — Mensagens operacionais (nunca técnicas ao operador)
 *
 * @module frontend/shared/recovery/RecoveryMessages
 */

const MESSAGES = Object.freeze({
  NOT_RESUMABLE: 'A operação não pode mais ser retomada.',
  REMOVED: 'Esta operação foi removida.',
  RECOVER_FAILED: 'Não foi possível recuperar esta operação agora.',
  CONNECTION: 'Verifique sua conexão e tente novamente.',
  CORRUPT: 'A operação não pode mais ser retomada.',
  EXPIRED: 'A operação não pode mais ser retomada.',
  AUTH_EXPIRED: 'A autorização desta operação expirou. Solicite nova liberação se necessário.'
});

/**
 * Converte erro técnico em mensagem operacional.
 * @param {Error|string|Object} error
 * @returns {string}
 */
function toOperationalMessage(error) {
  const raw = String(
    (error && error.operationalMessage)
    || (error && error.message)
    || error
    || ''
  );

  if (/não encontrada|nao encontrada|not found|404|removid/i.test(raw)) {
    return MESSAGES.REMOVED;
  }
  if (/checksum|corrupt|integridade|invalid checkpoint/i.test(raw)) {
    return MESSAGES.CORRUPT;
  }
  if (/network|failed to fetch|offline|econnrefused|timeout|net::|socket/i.test(raw)) {
    return MESSAGES.CONNECTION;
  }
  if (/expir/i.test(raw)) {
    return MESSAGES.EXPIRED;
  }
  if (/não pode mais ser retomada|nao pode mais ser retomada/i.test(raw)) {
    return MESSAGES.NOT_RESUMABLE;
  }
  if (/não foi possível recuperar|nao foi possivel recuperar/i.test(raw)) {
    return MESSAGES.RECOVER_FAILED;
  }

  return MESSAGES.RECOVER_FAILED;
}

function createOperationalError(codeOrMessage, cause) {
  const message = MESSAGES[codeOrMessage] || codeOrMessage || MESSAGES.RECOVER_FAILED;
  const err = new Error(message);
  err.operational = true;
  err.operationalMessage = message;
  if (cause) err.cause = cause;
  return err;
}

module.exports = {
  MESSAGES,
  toOperationalMessage,
  createOperationalError
};
