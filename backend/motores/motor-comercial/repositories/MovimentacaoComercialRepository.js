/**
 * MovimentacaoComercialRepository — Ledger Consignacao (append-only).
 *
 * Implementa IMovimentacaoComercialRepository.
 *
 * @class MovimentacaoComercialRepository
 * @extends BaseRepository
 */

const BaseRepository = require('../infrastructure/base/BaseRepository');
const { TABELAS } = require('../config/comercialConstants');
const { mapMovimentacaoComercialFromRow } = require('../utils/comercialMapper');

class MovimentacaoComercialRepository extends BaseRepository {
  static TABELA = TABELAS.MOVIMENTACOES_COMERCIAIS;

  async buscarPorId(id) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();
      const row = await sql.get(
        `SELECT * FROM ${MovimentacaoComercialRepository.TABELA} WHERE id = ?`,
        [id]
      );
      return mapMovimentacaoComercialFromRow(row);
    });
  }

  async listar(filtros = {}) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      let query = `SELECT * FROM ${MovimentacaoComercialRepository.TABELA} WHERE 1=1`;
      const params = [];

      if (filtros.consignacaoId != null) {
        query += ' AND consignacao_id = ?';
        params.push(filtros.consignacaoId);
      }
      if (filtros.perfilComercialId != null) {
        query = `
          SELECT m.* FROM ${MovimentacaoComercialRepository.TABELA} m
          INNER JOIN consignacoes c ON c.id = m.consignacao_id
          WHERE c.perfil_comercial_id = ?
        `;
        params.length = 0;
        params.push(filtros.perfilComercialId);
        if (filtros.tipoMovimentacao) {
          query += ' AND m.tipo_movimentacao = ?';
          params.push(filtros.tipoMovimentacao);
        }
        if (filtros.correlationId) {
          query += ' AND m.correlation_id = ?';
          params.push(filtros.correlationId);
        }
        if (filtros.grupoPrestacaoContasId) {
          query += ' AND m.grupo_prestacao_contas_id = ?';
          params.push(filtros.grupoPrestacaoContasId);
        }
        if (filtros.dataInicio && filtros.dataFim) {
          query += ' AND date(m.data_movimentacao) BETWEEN date(?) AND date(?)';
          params.push(filtros.dataInicio, filtros.dataFim);
        }
        query += ' ORDER BY m.data_movimentacao ASC, m.id ASC';
        const pag = this._paginacao(filtros);
        query += pag.sql;
        params.push(...pag.params);
        const rows = await sql.all(query, params);
        return rows.map(mapMovimentacaoComercialFromRow);
      }
      if (filtros.tipoMovimentacao) {
        query += ' AND tipo_movimentacao = ?';
        params.push(filtros.tipoMovimentacao);
      }
      if (filtros.correlationId) {
        query += ' AND correlation_id = ?';
        params.push(filtros.correlationId);
      }
      if (filtros.grupoPrestacaoContasId) {
        query += ' AND grupo_prestacao_contas_id = ?';
        params.push(filtros.grupoPrestacaoContasId);
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
      return rows.map(mapMovimentacaoComercialFromRow);
    });
  }

  /**
   * Agregação oficial por perfil — evita N+1 (STAB-02).
   * @param {number|string} perfilComercialId
   * @returns {Promise<Object[]>}
   */
  async listarPorPerfilComercialId(perfilComercialId) {
    return this.listar({ perfilComercialId });
  }

  /**
   * Guarda append-only: qualquer tentativa de UPDATE/DELETE deve logar e falhar
   * antes de tocar o SQLite (o trigger também aborta).
   * @private
   */
  _bloquearMutacaoLedger(operacao, metodo, sql, params = []) {
    const stack = new Error().stack;
    console.error('\n====================');
    console.error('LEDGER');
    console.error('====================');
    console.error('Operação:', operacao);
    console.error('Repository: MovimentacaoComercialRepository');
    console.error('Método:', metodo);
    console.error('SQL:', sql);
    console.error('Parâmetros:', JSON.stringify(params));
    console.error('Stack:\n', stack);
    console.error('====================\n');

    const err = new Error(
      `VIOLAÇÃO APPEND-ONLY: ${metodo} tentou ${operacao} em movimentacoes_comerciais`
    );
    err.name = 'LedgerAppendOnlyError';
    err.codigo = 'LEDGER_APPEND_ONLY_VIOLATION';
    err.rule = 'LEDGER_COMERCIAL_APPEND_ONLY';
    err.detalhes = {
      detail: 'Ledger Comercial é append-only. Use lançamento compensatório (INSERT), nunca UPDATE/DELETE.',
      rule: 'LEDGER_COMERCIAL_APPEND_ONLY',
      arquivo: 'MovimentacaoComercialRepository.js',
      linha: metodo,
      payload: { operacao, sql, params }
    };
    throw err;
  }

  /**
   * @deprecated Removido — violava append-only (trg_mov_comerciais_no_update).
   */
  async atualizarGrupoPrestacaoContasId(id, grupoPrestacaoContasId) {
    this._bloquearMutacaoLedger(
      'UPDATE',
      'atualizarGrupoPrestacaoContasId',
      'UPDATE movimentacoes_comerciais SET grupo_prestacao_contas_id = ? WHERE id = ?',
      [grupoPrestacaoContasId, id]
    );
  }

  /**
   * Bloqueio explícito — ledger não possui atualizar.
   */
  async atualizar() {
    this._bloquearMutacaoLedger(
      'UPDATE',
      'atualizar',
      'UPDATE movimentacoes_comerciais ...',
      []
    );
  }

  /**
   * Bloqueio explícito — ledger não possui deletar.
   */
  async deletar() {
    this._bloquearMutacaoLedger(
      'DELETE',
      'deletar',
      'DELETE FROM movimentacoes_comerciais ...',
      []
    );
  }

  async inserir(dados) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      const ref = dados.referenciaExterna || {};
      const result = await sql.run(
        `INSERT INTO ${MovimentacaoComercialRepository.TABELA} (
          consignacao_id, consignacao_item_id, tipo_movimentacao, origem,
          correlation_id, causation_id, grupo_prestacao_contas_id, snapshot,
          usuario_id, data_movimentacao, valor, quantidade, motivo,
          referencia_externa_tipo, referencia_externa_id, detalhes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dados.consignacaoId,
          dados.consignacaoItemId ?? null,
          dados.tipoMovimentacao,
          dados.origem,
          dados.correlationId,
          dados.causationId ?? null,
          dados.grupoPrestacaoContasId ?? null,
          this._serializarJson(dados.snapshot),
          dados.usuarioId ?? null,
          dados.dataMovimentacao,
          dados.valor ?? null,
          dados.quantidade ?? null,
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

module.exports = MovimentacaoComercialRepository;
