/**
 * MovimentacaoPerfilRepository — Ledger PerfilComercial (append-only).
 *
 * Implementa IMovimentacaoPerfilRepository.
 *
 * @class MovimentacaoPerfilRepository
 * @extends BaseRepository
 */

const BaseRepository = require('../infrastructure/base/BaseRepository');
const { TABELAS } = require('../config/comercialConstants');
const { mapMovimentacaoPerfilFromRow } = require('../utils/comercialMapper');

class MovimentacaoPerfilRepository extends BaseRepository {
  static TABELA = TABELAS.MOVIMENTACOES_PERFIL;

  async buscarPorId(id) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();
      const row = await sql.get(
        `SELECT * FROM ${MovimentacaoPerfilRepository.TABELA} WHERE id = ?`,
        [id]
      );
      return mapMovimentacaoPerfilFromRow(row);
    });
  }

  async listar(filtros = {}) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      let query = `SELECT * FROM ${MovimentacaoPerfilRepository.TABELA} WHERE 1=1`;
      const params = [];

      if (filtros.perfilComercialId != null) {
        query += ' AND perfil_comercial_id = ?';
        params.push(filtros.perfilComercialId);
      }
      if (filtros.clienteId != null) {
        query += ' AND cliente_id = ?';
        params.push(filtros.clienteId);
      }
      if (filtros.tipoMovimentacao) {
        query += ' AND tipo_movimentacao = ?';
        params.push(filtros.tipoMovimentacao);
      }
      if (filtros.correlationId) {
        query += ' AND correlation_id = ?';
        params.push(filtros.correlationId);
      }
      if (filtros.dataInicio && filtros.dataFim) {
        query += ' AND date(data_movimentacao) BETWEEN date(?) AND date(?)';
        params.push(filtros.dataInicio, filtros.dataFim);
      }

      query += ' ORDER BY data_movimentacao ASC, id ASC';
      const pag = this._paginacao(filtros);
      query += pag.sql;
      params.push(...pag.params);

      const rows = await sql.all(query, params);
      return rows.map(mapMovimentacaoPerfilFromRow);
    });
  }

  async inserir(dados) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      const ref = dados.referenciaExterna || {};
      const result = await sql.run(
        `INSERT INTO ${MovimentacaoPerfilRepository.TABELA} (
          perfil_comercial_id, cliente_id, tipo_movimentacao, origem,
          correlation_id, causation_id, snapshot,
          usuario_id, data_movimentacao, valor, motivo,
          referencia_externa_tipo, referencia_externa_id, detalhes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dados.perfilComercialId,
          dados.clienteId,
          dados.tipoMovimentacao,
          dados.origem,
          dados.correlationId,
          dados.causationId ?? null,
          this._serializarJson(dados.snapshot),
          dados.usuarioId ?? null,
          dados.dataMovimentacao,
          dados.valor ?? null,
          dados.motivo ?? null,
          ref.tipo ?? null,
          ref.id ?? null,
          this._serializarJson(dados.detalhes)
        ]
      );

      return this.buscarPorId(result.lastID);
    });
  }
}

module.exports = MovimentacaoPerfilRepository;
