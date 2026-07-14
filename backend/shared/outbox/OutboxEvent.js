/**
 * OutboxEvent — Modelo de evento transacional Outbox.
 *
 * Sprint P-2 — Outbox Pattern CDS Platform.
 *
 * @module backend/shared/outbox/OutboxEvent
 */

const OUTBOX_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  DEAD_LETTER: 'DEAD_LETTER'
});

/**
 * @param {Object} dados
 * @returns {Object}
 */
function criarOutboxEvent(dados) {
  const eventType = dados.eventType ?? dados.event_type;
  const correlationId = dados.correlationId ?? dados.correlation_id;

  if (!eventType) {
    throw new Error('OutboxEvent: eventType é obrigatório');
  }
  if (!correlationId) {
    throw new Error('OutboxEvent: correlationId é obrigatório');
  }

  const idempotencyKey = dados.idempotencyKey
    ?? dados.idempotency_key
    ?? `${eventType}:${correlationId}`;

  return {
    id: dados.id ?? null,
    motor: dados.motor ?? 'motor-comercial',
    eventType,
    bridgeName: dados.bridgeName ?? dados.bridge_name ?? null,
    payload: dados.payload ?? {},
    correlationId,
    requestId: dados.requestId ?? dados.request_id ?? null,
    idempotencyKey,
    status: dados.status ?? OUTBOX_STATUS.PENDING,
    attempts: dados.attempts ?? 0,
    maxAttempts: dados.maxAttempts ?? dados.max_attempts ?? 5,
    lastError: dados.lastError ?? dados.last_error ?? null,
    nextRetryAt: dados.nextRetryAt ?? dados.next_retry_at ?? null,
    durationMs: dados.durationMs ?? dados.duration_ms ?? null,
    createdAt: dados.createdAt ?? dados.created_at ?? null,
    processedAt: dados.processedAt ?? dados.processed_at ?? null
  };
}

/**
 * @param {Object} row
 * @returns {Object}
 */
function mapOutboxEventFromRow(row) {
  if (!row) return null;

  let payload = row.payload;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }

  return criarOutboxEvent({
    id: row.id,
    motor: row.motor,
    eventType: row.event_type,
    bridgeName: row.bridge_name,
    payload,
    correlationId: row.correlation_id,
    requestId: row.request_id,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    attempts: row.attempts,
    maxAttempts: row.max_attempts,
    lastError: row.last_error,
    nextRetryAt: row.next_retry_at,
    durationMs: row.duration_ms,
    createdAt: row.created_at,
    processedAt: row.processed_at
  });
}

module.exports = {
  OUTBOX_STATUS,
  criarOutboxEvent,
  mapOutboxEventFromRow
};
