/**
 * 008 — Tabela outbox_events (Transactional Outbox — Sprint P-2)
 *
 * @param {Object} db
 * @returns {Promise<void>}
 */
function migration008Outbox(db) {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS outbox_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        motor TEXT NOT NULL DEFAULT 'motor-comercial',
        event_type TEXT NOT NULL,
        bridge_name TEXT NOT NULL,
        payload TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        request_id TEXT,
        idempotency_key TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'PENDING',
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 5,
        last_error TEXT,
        next_retry_at DATETIME,
        duration_ms INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME
      )
    `, (err) => {
      if (err) return reject(err);

      db.run(
        'CREATE INDEX IF NOT EXISTS idx_outbox_status ON outbox_events(status, next_retry_at)',
        (idxErr) => (idxErr ? reject(idxErr) : resolve())
      );
    });
  }).then(() => new Promise((resolve, reject) => {
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_outbox_correlation ON outbox_events(correlation_id)',
      (err) => (err ? reject(err) : resolve())
    );
  })).then(() => new Promise((resolve, reject) => {
    db.run(
      'CREATE INDEX IF NOT EXISTS idx_outbox_motor_created ON outbox_events(motor, created_at)',
      (err) => (err ? reject(err) : resolve())
    );
  }));
}

module.exports = migration008Outbox;
