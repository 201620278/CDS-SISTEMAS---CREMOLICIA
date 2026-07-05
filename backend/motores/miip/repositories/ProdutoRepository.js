/**
 * ProdutoRepository — Única fonte oficial de leitura de produtos para o MIIP.
 *
 * Sprint 3.1: todo Engine consulta produtos exclusivamente por este repository.
 * Nenhum Engine executa SQL — toda persistência fica aqui.
 *
 * @class ProdutoRepository
 */

const ProdutoSnapshot = require('../core/ProdutoSnapshot');
const { resolverDb, criarDbHelpers } = require('./dbHelpers');
const produtoCache = require('../cache/ProdutoCache');

const COLUNAS_LEITURA = `
  id,
  codigo,
  codigo_barras,
  nome,
  unidade,
  ncm,
  cest,
  categoria_id,
  subcategoria_id,
  fornecedor,
  ativo
`;

class ProdutoRepository {
  /**
   * @param {Object} [deps]
   * @param {Object|null} [deps.db] - Instância SQLite
   */
  constructor(deps = {}) {
    this._db = deps.db ?? resolverDb(deps);
    this._helpers = this._db ? criarDbHelpers(this._db) : null;
  }

  /**
   * @private
   * @param {Object} row
   * @returns {ProdutoSnapshot|null}
   */
  _mapearSnapshot(row) {
    return ProdutoSnapshot.fromRow(row);
  }

  /**
   * Busca produto por ID.
   *
   * @param {number} id
   * @returns {Promise<ProdutoSnapshot|null>}
   */
  async buscarPorId(id) {
    const produtoId = Number(id);
    if (!Number.isFinite(produtoId) || produtoId <= 0 || !this._helpers) return null;

    const emCache = produtoCache.buscarPorId(produtoId);
    if (emCache) return emCache;

    await this._helpers.whenReady();

    const row = await this._helpers.get(
      `SELECT ${COLUNAS_LEITURA} FROM produtos WHERE id = ? LIMIT 1`,
      [produtoId]
    );

    const snapshot = this._mapearSnapshot(row);
    if (snapshot) produtoCache.armazenar(snapshot);
    return snapshot;
  }

  /**
   * Busca produto por GTIN/EAN exato em `codigo_barras`.
   *
   * @param {string} gtin - GTIN já normalizado
   * @returns {Promise<ProdutoSnapshot|null>}
   */
  async buscarPorGtin(gtin) {
    if (!gtin || !this._helpers) return null;

    const emCache = produtoCache.buscarPorGtin(gtin);
    if (emCache) return emCache;

    await this._helpers.whenReady();

    const row = await this._helpers.get(
      `SELECT ${COLUNAS_LEITURA} FROM produtos WHERE codigo_barras = ? LIMIT 1`,
      [gtin]
    );

    const snapshot = this._mapearSnapshot(row);
    if (snapshot) produtoCache.armazenar(snapshot);
    return snapshot;
  }
}

module.exports = new ProdutoRepository();
module.exports.ProdutoRepository = ProdutoRepository;
