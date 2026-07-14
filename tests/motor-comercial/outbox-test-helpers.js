/**
 * Helpers de teste para Outbox Pattern — Sprint P-2.
 */

const {
  OUTBOX_STATUS,
  criarOutboxConfiguration,
  OutboxDispatcher,
  OutboxProcessor,
  OutboxService
} = require('../../backend/shared/outbox');
const { criarComercialOutboxHandlers } = require('../../backend/motores/motor-comercial/integrations/outbox/ComercialOutboxHandlers');

function criarInMemoryOutboxRepository() {
  const store = new Map();
  let seq = 0;

  return {
    store,
    async inserir(evento) {
      const existente = [...store.values()].find((e) => e.idempotencyKey === evento.idempotencyKey);
      if (existente) return existente;

      seq += 1;
      const registro = {
        ...evento,
        id: seq,
        status: OUTBOX_STATUS.PENDING,
        attempts: 0,
        maxAttempts: evento.maxAttempts ?? 5
      };
      store.set(seq, registro);
      return registro;
    },
    async listarPorIds(ids) {
      return ids.map((id) => store.get(id)).filter(Boolean);
    },
    async marcarProcessando(id) {
      const evento = store.get(id);
      if (evento) evento.status = OUTBOX_STATUS.PROCESSING;
      return evento ?? null;
    },
    async marcarConcluido(id, dados = {}) {
      const evento = store.get(id);
      if (evento) {
        evento.status = OUTBOX_STATUS.COMPLETED;
        evento.durationMs = dados.durationMs ?? null;
      }
      return evento ?? null;
    },
    async marcarFalha(id, dados = {}) {
      const evento = store.get(id);
      if (!evento) return null;
      evento.attempts += 1;
      evento.lastError = dados.erro?.message ?? String(dados.erro);
      evento.status = evento.attempts >= evento.maxAttempts
        ? OUTBOX_STATUS.DEAD_LETTER
        : OUTBOX_STATUS.FAILED;
      return evento;
    }
  };
}

/**
 * @param {Object} bridges
 * @returns {import('../../backend/shared/outbox/OutboxService')}
 */
function criarMockOutboxService(bridges = {}) {
  const repository = criarInMemoryOutboxRepository();
  const config = criarOutboxConfiguration({
    maxAttempts: 3,
    initialDelayMs: 0,
    maxDelayMs: 0
  });
  const dispatcher = new OutboxDispatcher({ config });
  dispatcher.registrarHandlers(criarComercialOutboxHandlers(bridges));
  const processor = new OutboxProcessor({ repository, dispatcher, config });
  return new OutboxService({ repository, processor, config });
}

/**
 * Em testes unitários sem SQLite transacional, o OutboxService usa repositório in-memory.
 * Não expor obterDbTransacional no UoW mock.
 *
 * @param {Object} uow
 * @returns {Object}
 */
function adaptarUowParaOutbox(uow) {
  return uow;
}

module.exports = {
  criarMockOutboxService,
  adaptarUowParaOutbox
};
