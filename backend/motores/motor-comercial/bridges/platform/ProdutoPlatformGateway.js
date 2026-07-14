/**
 * ProdutoPlatformGateway — Integração real com cadastro de produtos CDS.
 *
 * Sprint O-13
 *
 * @module motores/motor-comercial/bridges/platform/ProdutoPlatformGateway
 */

const { dbGet } = require('./dbHelpers');
const { assegurarBancoNoGateway } = require('./platformGatewayGuards');

class ProdutoPlatformGateway {
  /**
   * @param {Object} deps
   * @param {Object} deps.db
   */
  constructor(deps = {}) {
    this._db = deps.db;
  }

  /**
   * @param {string|number} produtoId
   * @returns {Promise<Object|null>}
   */
  async buscarPorId(produtoId) {
    assegurarBancoNoGateway(this, 'buscarPorId');
    if (produtoId == null) return null;

    const row = await dbGet(this._db, 'SELECT * FROM produtos WHERE id = ?', [produtoId]);
    if (!row) return null;

    return {
      id: row.id,
      nome: row.nome,
      descricao: row.descricao ?? row.nome,
      codigo: row.codigo ?? null,
      codigoBarras: row.codigo_barras ?? null,
      unidade: row.unidade ?? 'UN',
      precoVenda: Number(row.preco_venda ?? 0),
      precoCusto: Number(row.preco_custo ?? 0),
      estoqueAtual: Number(row.estoque_atual ?? 0),
      saldoFiscal: Number(row.saldo_fiscal ?? 0),
      saldoNaoFiscal: Number(row.saldo_nao_fiscal ?? 0),
      itemFiscal: Number(row.item_fiscal ?? 0) === 1,
      ativo: Number(row.ativo ?? 1) === 1,
      origem: 'platform:produtos'
    };
  }

  /**
   * @param {string|number} produtoId
   * @returns {Promise<boolean>}
   */
  async estaAtivo(produtoId) {
    const produto = await this.buscarPorId(produtoId);
    return Boolean(produto?.ativo);
  }

  /**
   * @param {string|number} produtoId
   * @param {string} [tabelaPreco]
   * @returns {Promise<Object>}
   */
  async consultarPreco(produtoId, tabelaPreco) {
    const produto = await this.buscarPorId(produtoId);
    if (!produto) throw new Error('Produto não encontrado');

    return {
      produtoId,
      tabelaPreco: tabelaPreco || 'PADRAO',
      precoVenda: produto.precoVenda,
      precoCusto: produto.precoCusto,
      origem: 'platform:produtos'
    };
  }

  /**
   * @param {string|number} produtoId
   * @returns {Promise<Object>}
   */
  async consultarEstoqueDisponivel(produtoId) {
    const produto = await this.buscarPorId(produtoId);
    if (!produto) throw new Error('Produto não encontrado');

    return {
      produtoId,
      quantidadeDisponivel: produto.estoqueAtual,
      saldoFiscal: produto.saldoFiscal,
      saldoNaoFiscal: produto.saldoNaoFiscal,
      origem: 'platform:produtos'
    };
  }
}

module.exports = ProdutoPlatformGateway;
