/**
 * EstoquePlatformGateway — Integração real via ajusteEstoqueService CDS.
 *
 * Sprint O-13
 *
 * @module motores/motor-comercial/bridges/platform/EstoquePlatformGateway
 */

const { promisify } = require('util');
const { dbGet } = require('./dbHelpers');
const { aplicarAjusteEstoqueProduto } = require('../../../../services/ajusteEstoqueService');
const lotesService = require('../../../../services/lotesService');

const aplicarAjusteAsync = promisify(aplicarAjusteEstoqueProduto);

class EstoquePlatformGateway {
  /**
   * @param {Object} deps
   * @param {Object} deps.db
   */
  constructor(deps = {}) {
    this._db = deps.db;
  }

  /**
   * @param {Object} dados
   * @returns {Promise<Object>}
   */
  async registrarSaida(dados) {
    const { produtoId, quantidade, consignacaoId, correlationId, usuarioId, usuarioNome } = dados;
    const qtd = Number(quantidade);
    if (!produtoId || qtd <= 0) {
      throw new Error('produtoId e quantidade são obrigatórios para saída de estoque');
    }

    const produto = await dbGet(this._db, 'SELECT item_fiscal FROM produtos WHERE id = ?', [produtoId]);
    if (!produto) throw new Error('Produto não encontrado');

    const ajusteFiscal = produto.item_fiscal ? -qtd : 0;
    const ajusteNaoFiscal = produto.item_fiscal ? 0 : -qtd;

    await aplicarAjusteAsync(this._db, {
      produtoId,
      ajusteFiscal,
      ajusteNaoFiscal,
      motivo: `CONSIGNACAO_SAIDA:${consignacaoId}`,
      usuarioId: usuarioId ?? null,
      usuarioNome: usuarioNome ?? 'Motor Comercial',
      lotesService
    });

    return {
      produtoId,
      quantidade: qtd,
      tipo: 'SAIDA',
      motivo: 'CONSIGNACAO',
      consignacaoId,
      correlationId,
      origem: 'platform:ajusteEstoqueService'
    };
  }

  /**
   * @param {Object} dados
   * @returns {Promise<Object>}
   */
  async registrarEntrada(dados) {
    const { produtoId, quantidade, consignacaoId, correlationId, usuarioId, usuarioNome } = dados;
    const qtd = Number(quantidade);
    if (!produtoId || qtd <= 0) {
      throw new Error('produtoId e quantidade são obrigatórios para entrada de estoque');
    }

    const produto = await dbGet(this._db, 'SELECT item_fiscal FROM produtos WHERE id = ?', [produtoId]);
    if (!produto) throw new Error('Produto não encontrado');

    const ajusteFiscal = produto.item_fiscal ? qtd : 0;
    const ajusteNaoFiscal = produto.item_fiscal ? 0 : qtd;

    await aplicarAjusteAsync(this._db, {
      produtoId,
      ajusteFiscal,
      ajusteNaoFiscal,
      motivo: `CONSIGNACAO_DEVOLUCAO:${consignacaoId}`,
      usuarioId: usuarioId ?? null,
      usuarioNome: usuarioNome ?? 'Motor Comercial',
      lotesService
    });

    return {
      produtoId,
      quantidade: qtd,
      tipo: 'ENTRADA',
      motivo: 'DEVOLUCAO',
      consignacaoId,
      correlationId,
      origem: 'platform:ajusteEstoqueService'
    };
  }

  /**
   * Transferência entre consignações não altera estoque físico (já baixado na entrega).
   * @param {Object} dados
   * @returns {Promise<Object>}
   */
  async registrarTransferencia(dados) {
    return {
      consignacaoOrigemId: dados.consignacaoOrigemId,
      consignacaoDestinoId: dados.consignacaoDestinoId,
      itens: dados.itens ?? [],
      tipo: 'TRANSFERENCIA',
      correlationId: dados.correlationId,
      origem: 'platform:consignacao-transferencia',
      observacao: 'Sem movimentação de estoque físico — transferência contábil entre consignações'
    };
  }

  /**
   * @param {string|number} produtoId
   * @returns {Promise<Object>}
   */
  async consultarSaldo(produtoId) {
    const row = await dbGet(this._db, `
      SELECT id, estoque_atual, saldo_fiscal, saldo_nao_fiscal
      FROM produtos WHERE id = ?
    `, [produtoId]);

    if (!row) throw new Error('Produto não encontrado');

    return {
      produtoId,
      quantidadeDisponivel: Number(row.estoque_atual ?? 0),
      saldoFiscal: Number(row.saldo_fiscal ?? 0),
      saldoNaoFiscal: Number(row.saldo_nao_fiscal ?? 0),
      origem: 'platform:produtos'
    };
  }
}

module.exports = EstoquePlatformGateway;
