/**
 * ConsignacaoItemRepository — Persistência de itens da Consignacao.
 *
 * Implementa IConsignacaoItemRepository.
 *
 * @class ConsignacaoItemRepository
 * @extends BaseRepository
 */

const BaseRepository = require('../infrastructure/base/BaseRepository');
const { TABELAS } = require('../config/comercialConstants');
const { mapConsignacaoItemFromRow } = require('../utils/comercialMapper');

const MAPA_CAMPOS = {
  consignacaoId: 'consignacao_id',
  produtoId: 'produto_id',
  quantidadeEntregue: 'quantidade_entregue',
  quantidadeDevolvida: 'quantidade_devolvida',
  quantidadeVendida: 'quantidade_vendida',
  quantidadePerdida: 'quantidade_perdida',
  quantidadeCortesia: 'quantidade_cortesia',
  precoUnitario: 'preco_unitario',
  subtotalEntregue: 'subtotal_entregue',
  subtotalAcertado: 'subtotal_acertado'
};

class ConsignacaoItemRepository extends BaseRepository {
  static TABELA = TABELAS.CONSIGNACOES_ITENS;

  async buscarPorId(id) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();
      const row = await sql.get(
        `SELECT * FROM ${ConsignacaoItemRepository.TABELA} WHERE id = ?`,
        [id]
      );
      return mapConsignacaoItemFromRow(row);
    });
  }

  async listarPorConsignacao(consignacaoId, filtros = {}) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      let query = `SELECT * FROM ${ConsignacaoItemRepository.TABELA} WHERE consignacao_id = ?`;
      const params = [consignacaoId];

      if (filtros.produtoId != null) {
        query += ' AND produto_id = ?';
        params.push(filtros.produtoId);
      }

      query += ' ORDER BY id ASC';
      const pag = this._paginacao(filtros);
      query += pag.sql;
      params.push(...pag.params);

      const rows = await sql.all(query, params);
      return rows.map(mapConsignacaoItemFromRow);
    });
  }

  async inserir(dados) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      const result = await sql.run(
        `INSERT INTO ${ConsignacaoItemRepository.TABELA} (
          consignacao_id, produto_id,
          quantidade_entregue, quantidade_devolvida, quantidade_vendida,
          quantidade_perdida, quantidade_cortesia,
          preco_unitario, subtotal_entregue, subtotal_acertado
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dados.consignacaoId,
          dados.produtoId,
          dados.quantidadeEntregue ?? 0,
          dados.quantidadeDevolvida ?? 0,
          dados.quantidadeVendida ?? 0,
          dados.quantidadePerdida ?? 0,
          dados.quantidadeCortesia ?? 0,
          dados.precoUnitario ?? 0,
          dados.subtotalEntregue ?? 0,
          dados.subtotalAcertado ?? 0
        ]
      );

      return this.buscarPorId(result.lastID);
    });
  }

  async atualizar(id, dados) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      const { sets, params } = this._montarCamposUpdate(dados, MAPA_CAMPOS);
      if (!sets.length) {
        return this.buscarPorId(id);
      }

      sets.push('updated_at = CURRENT_TIMESTAMP');
      await sql.run(
        `UPDATE ${ConsignacaoItemRepository.TABELA} SET ${sets.join(', ')} WHERE id = ?`,
        [...params, id]
      );

      return this.buscarPorId(id);
    });
  }

  async remover(id) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();
      const result = await sql.run(
        `DELETE FROM ${ConsignacaoItemRepository.TABELA} WHERE id = ?`,
        [id]
      );
      return result.changes > 0;
    });
  }
}

module.exports = ConsignacaoItemRepository;
