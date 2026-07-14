/**
 * TransactionManager — Isola transações SQLite do domínio.
 *
 * Sprint 2.2.5: infraestrutura — Use Cases não abrem transação diretamente.
 *
 * @class TransactionManager
 */

const { resolverDb } = require('../../repositories/dbHelpers');

class TransactionManager {
  /**
   * @param {Object} [deps]
   * @param {Object} [deps.db]
   */
  constructor(deps = {}) {
    this._db = deps.db ?? null;
    this._emTransacao = false;
    this._nivel = 0;
  }

  /**
   * @returns {Object}
   */
  _obterDb() {
    return resolverDb(this._db);
  }

  /**
   * @param {string} sql
   * @returns {Promise<void>}
   */
  _run(sql) {
    const db = this._obterDb();
    return new Promise((resolve, reject) => {
      db.run(sql, (err) => (err ? reject(err) : resolve()));
    });
  }

  /**
   * @returns {Promise<Object>}
   */
  async whenReady() {
    const db = this._obterDb();
    if (typeof db.whenReady === 'function') {
      return new Promise((resolve, reject) => {
        db.whenReady((err) => (err ? reject(err) : resolve(db)));
      });
    }
    return db;
  }

  /**
   * @returns {Promise<Object>}
   */
  async iniciar() {
    await this.whenReady();

    if (this._emTransacao) {
      this._nivel += 1;
      return this._obterDb();
    }

    await this._run('BEGIN');
    this._emTransacao = true;
    this._nivel = 1;
    return this._obterDb();
  }

  /**
   * @returns {Promise<void>}
   */
  async confirmar() {
    if (!this._emTransacao) return;

    if (this._nivel > 1) {
      this._nivel -= 1;
      return;
    }

    await this._run('COMMIT');
    this._emTransacao = false;
    this._nivel = 0;
  }

  /**
   * @returns {Promise<void>}
   */
  async cancelar() {
    if (!this._emTransacao) return;

    await this._run('ROLLBACK');
    this._emTransacao = false;
    this._nivel = 0;
  }

  /**
   * @returns {boolean}
   */
  isEmTransacao() {
    return this._emTransacao;
  }

  /**
   * @param {Function} operacao
   * @returns {Promise<*>}
   */
  async executar(operacao) {
    await this.iniciar();
    try {
      const resultado = await operacao(this._obterDb());
      await this.confirmar();
      return resultado;
    } catch (err) {
      await this.cancelar();
      throw err;
    }
  }
}

module.exports = TransactionManager;
