/**
 * OutboxRepository — Persistência transacional de eventos Outbox.
 *
 * @module backend/shared/outbox/OutboxRepository
 */

const { criarDbHelpers, resolverDb, serializarJson } = require('../../motores/motor-comercial/repositories/dbHelpers');
const { criarOutboxEvent, mapOutboxEventFromRow, OUTBOX_STATUS } = require('./OutboxEvent');
const { criarOutboxConfiguration } = require('./OutboxConfiguration');

class OutboxRepository {
  /**
   * @param {Object} [deps]
   * @param {Object} [deps.db]
   * @param {Object} [deps.config]
   */
  constructor(deps = {}) {
    this._db = deps.db ?? null;
    this._config = deps.config ?? criarOutboxConfiguration();
    this._sql = null;
  }

  /**
   * @returns {import('../../motores/motor-comercial/repositories/dbHelpers')}
   */
  _obterSql() {
    if (!this._sql) {
      this._sql = criarDbHelpers(resolverDb(this._db));
    }
    return this._sql;
  }

  /**
   * @returns {string}
   */
  _tabela() {
    return this._config.tabela;
  }

  /**
   * @param {Object} dados
   * @returns {Promise<Object>}
   */
  async inserir(dados) {
    const evento = criarOutboxEvent({
      ...dados,
      maxAttempts: dados.maxAttempts ?? this._config.maxAttempts,
      motor: dados.motor ?? this._config.motor
    });

    const sql = this._obterSql();
    await sql.whenReady();

    const existente = await sql.get(
      `SELECT id, status FROM ${this._tabela()} WHERE idempotency_key = ?`,
      [evento.idempotencyKey]
    );

    if (existente) {
      if (existente.status === OUTBOX_STATUS.COMPLETED) {
        return mapOutboxEventFromRow(await sql.get(
          `SELECT * FROM ${this._tabela()} WHERE id = ?`,
          [existente.id]
        ));
      }
      return mapOutboxEventFromRow(await sql.get(
        `SELECT * FROM ${this._tabela()} WHERE id = ?`,
        [existente.id]
      ));
    }

    const resultado = await sql.run(
      `INSERT INTO ${this._tabela()} (
        motor, event_type, bridge_name, payload, correlation_id, request_id,
        idempotency_key, status, attempts, max_attempts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evento.motor,
        evento.eventType,
        evento.bridgeName,
        serializarJson(evento.payload),
        evento.correlationId,
        evento.requestId,
        evento.idempotencyKey,
        OUTBOX_STATUS.PENDING,
        0,
        evento.maxAttempts
      ]
    );

    return mapOutboxEventFromRow(await sql.get(
      `SELECT * FROM ${this._tabela()} WHERE id = ?`,
      [resultado.lastID]
    ));
  }

  /**
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(id) {
    const sql = this._obterSql();
    await sql.whenReady();
    const row = await sql.get(`SELECT * FROM ${this._tabela()} WHERE id = ?`, [id]);
    return mapOutboxEventFromRow(row);
  }

  /**
   * @param {string} idempotencyKey
   * @returns {Promise<Object|null>}
   */
  async buscarPorIdempotencyKey(idempotencyKey) {
    const sql = this._obterSql();
    await sql.whenReady();
    const row = await sql.get(
      `SELECT * FROM ${this._tabela()} WHERE idempotency_key = ?`,
      [idempotencyKey]
    );
    return mapOutboxEventFromRow(row);
  }

  /**
   * @param {Object} [filtros]
   * @returns {Promise<Object[]>}
   */
  async listarPendentes(filtros = {}) {
    const sql = this._obterSql();
    await sql.whenReady();

    const limite = Number(filtros.limite ?? 50);
    const motor = filtros.motor ?? this._config.motor;
    const agora = new Date().toISOString();

    const rows = await sql.all(
      `SELECT * FROM ${this._tabela()}
       WHERE motor = ?
         AND status IN (?, ?)
         AND attempts < max_attempts
         AND (next_retry_at IS NULL OR next_retry_at <= ?)
       ORDER BY created_at ASC
       LIMIT ?`,
      [motor, OUTBOX_STATUS.PENDING, OUTBOX_STATUS.FAILED, agora, limite]
    );

    return rows.map(mapOutboxEventFromRow);
  }

  /**
   * @param {number[]} ids
   * @returns {Promise<Object[]>}
   */
  async listarPorIds(ids = []) {
    if (!ids.length) return [];
    const sql = this._obterSql();
    await sql.whenReady();
    const placeholders = ids.map(() => '?').join(', ');
    const rows = await sql.all(
      `SELECT * FROM ${this._tabela()} WHERE id IN (${placeholders}) ORDER BY id ASC`,
      ids
    );
    return rows.map(mapOutboxEventFromRow);
  }

  /**
   * @param {Object} [filtros]
   * @returns {Promise<Object[]>}
   */
  async listarHistorico(filtros = {}) {
    const sql = this._obterSql();
    await sql.whenReady();

    let query = `SELECT * FROM ${this._tabela()} WHERE 1=1`;
    const params = [];

    if (filtros.motor) {
      query += ' AND motor = ?';
      params.push(filtros.motor);
    }
    if (filtros.status) {
      query += ' AND status = ?';
      params.push(filtros.status);
    }
    if (filtros.correlationId) {
      query += ' AND correlation_id = ?';
      params.push(filtros.correlationId);
    }
    if (filtros.bridgeName) {
      query += ' AND bridge_name = ?';
      params.push(filtros.bridgeName);
    }

    query += ' ORDER BY created_at DESC';

    const limite = Number(filtros.limite ?? 100);
    if (limite > 0) {
      query += ' LIMIT ?';
      params.push(limite);
    }

    const rows = await sql.all(query, params);
    return rows.map(mapOutboxEventFromRow);
  }

  /**
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  async marcarProcessando(id) {
    const sql = this._obterSql();
    await sql.run(
      `UPDATE ${this._tabela()} SET status = ? WHERE id = ? AND status IN (?, ?)`,
      [OUTBOX_STATUS.PROCESSING, id, OUTBOX_STATUS.PENDING, OUTBOX_STATUS.FAILED]
    );
    return this.buscarPorId(id);
  }

  /**
   * @param {number} id
   * @param {Object} dados
   * @returns {Promise<Object|null>}
   */
  async marcarConcluido(id, dados = {}) {
    const sql = this._obterSql();
    await sql.run(
      `UPDATE ${this._tabela()}
       SET status = ?, processed_at = ?, duration_ms = ?, last_error = NULL
       WHERE id = ?`,
      [OUTBOX_STATUS.COMPLETED, new Date().toISOString(), dados.durationMs ?? null, id]
    );
    return this.buscarPorId(id);
  }

  /**
   * @param {number} id
   * @param {Object} dados
   * @returns {Promise<Object|null>}
   */
  async marcarFalha(id, dados = {}) {
    const sql = this._obterSql();
    const evento = await this.buscarPorId(id);
    if (!evento) return null;

    const attempts = (evento.attempts ?? 0) + 1;
    const erro = dados.erro?.message ?? String(dados.erro ?? 'Erro desconhecido');
    const status = attempts >= evento.maxAttempts
      ? OUTBOX_STATUS.DEAD_LETTER
      : OUTBOX_STATUS.FAILED;

    const delay = this._calcularBackoff(attempts - 1);
    const nextRetryAt = status === OUTBOX_STATUS.FAILED
      ? new Date(Date.now() + delay).toISOString()
      : null;

    await sql.run(
      `UPDATE ${this._tabela()}
       SET status = ?, attempts = ?, last_error = ?, next_retry_at = ?, duration_ms = ?
       WHERE id = ?`,
      [status, attempts, erro, nextRetryAt, dados.durationMs ?? null, id]
    );

    return this.buscarPorId(id);
  }

  /**
   * @param {Object} [filtros]
   * @returns {Promise<Object>}
   */
  async obterStatus(filtros = {}) {
    const sql = this._obterSql();
    await sql.whenReady();

    const motor = filtros.motor ?? this._config.motor;
    const rows = await sql.all(
      `SELECT status, COUNT(*) as total
       FROM ${this._tabela()}
       WHERE motor = ?
       GROUP BY status`,
      [motor]
    );

    const resumo = {
      motor,
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      deadLetter: 0
    };

    for (const row of rows) {
      const total = Number(row.total ?? 0);
      resumo.total += total;
      switch (row.status) {
        case OUTBOX_STATUS.PENDING: resumo.pending = total; break;
        case OUTBOX_STATUS.PROCESSING: resumo.processing = total; break;
        case OUTBOX_STATUS.COMPLETED: resumo.completed = total; break;
        case OUTBOX_STATUS.FAILED: resumo.failed = total; break;
        case OUTBOX_STATUS.DEAD_LETTER: resumo.deadLetter = total; break;
        default: break;
      }
    }

    return resumo;
  }

  /**
   * @private
   * @param {number} attempt
   * @returns {number}
   */
  _calcularBackoff(attempt) {
    const delay = this._config.initialDelayMs * Math.pow(this._config.backoffMultiplier, attempt);
    return Math.min(delay, this._config.maxDelayMs);
  }
}

module.exports = OutboxRepository;
