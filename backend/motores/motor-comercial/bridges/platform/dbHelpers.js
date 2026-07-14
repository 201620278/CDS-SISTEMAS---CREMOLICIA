/**
 * Helpers promisificados para acesso SQLite da Plataforma CDS.
 *
 * Sprint O-13 — Integração real das Bridges.
 *
 * @module motores/motor-comercial/bridges/platform/dbHelpers
 */

/**
 * @param {import('sqlite3').Database} db
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<Object|undefined>}
 */
function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

/**
 * @param {import('sqlite3').Database} db
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<Array>}
 */
function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

/**
 * @param {import('sqlite3').Database} db
 * @param {string} sql
 * @param {Array} [params]
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function runCallback(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = { dbGet, dbAll, dbRun };
