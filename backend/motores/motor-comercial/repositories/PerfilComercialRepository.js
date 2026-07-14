/**
 * PerfilComercialRepository — Persistência do Aggregate PerfilComercial.
 *
 * Implementa IPerfilComercialRepository.
 *
 * @class PerfilComercialRepository
 * @extends BaseRepository
 */

const BaseRepository = require('../infrastructure/base/BaseRepository');
const { TABELAS } = require('../config/comercialConstants');
const { mapPerfilComercialFromRow } = require('../utils/comercialMapper');

const JOIN_CLIENTE_COLS = `
  c.nome AS cliente_nome,
  c.cpf_cnpj AS cliente_documento,
  c.telefone AS cliente_telefone,
  c.email AS cliente_email,
  c.cep AS cliente_cep,
  c.rua AS cliente_rua,
  c.numero AS cliente_numero,
  c.bairro AS cliente_bairro,
  c.cidade AS cliente_cidade,
  c.uf AS cliente_uf,
  c.limite_credito AS cliente_limite_credito,
  c.credito_atual AS cliente_credito_atual,
  c.created_at AS cliente_created_at
`;

const FROM_PERFIL_COM_CLIENTE = `
  FROM ${TABELAS.PERFIL_COMERCIAL} p
  LEFT JOIN clientes c ON c.id = p.cliente_id
`;

const MAPA_CAMPOS = {
  clienteId: 'cliente_id',
  perfilTipo: 'perfil_tipo',
  ativo: 'ativo',
  limiteComercial: 'limite_comercial',
  saldoAberto: 'saldo_aberto',
  bloqueado: 'bloqueado',
  motivoBloqueio: 'motivo_bloqueio',
  scoreConfiabilidade: 'score_confiabilidade',
  scoreCalculadoEm: 'score_calculado_em',
  dataAtivacao: 'data_ativacao',
  dataInativacao: 'data_inativacao',
  observacoes: 'observacoes'
};

class PerfilComercialRepository extends BaseRepository {
  static TABELA = TABELAS.PERFIL_COMERCIAL;

  _transformar(campo, valor) {
    if (campo === 'ativo' || campo === 'bloqueado') {
      return valor ? 1 : 0;
    }
    return valor;
  }

  async buscarPorId(id) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();
      const row = await sql.get(
        `SELECT p.*, ${JOIN_CLIENTE_COLS} ${FROM_PERFIL_COM_CLIENTE} WHERE p.id = ?`,
        [id]
      );
      return mapPerfilComercialFromRow(row);
    });
  }

  async listar(filtros = {}) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      let query = `SELECT p.*, ${JOIN_CLIENTE_COLS} ${FROM_PERFIL_COM_CLIENTE} WHERE 1=1`;
      const params = [];

      if (filtros.clienteId != null) {
        query += ' AND p.cliente_id = ?';
        params.push(filtros.clienteId);
      }
      if (filtros.perfilTipo) {
        query += ' AND p.perfil_tipo = ?';
        params.push(filtros.perfilTipo);
      }
      if (filtros.ativo != null) {
        query += ' AND p.ativo = ?';
        params.push(filtros.ativo ? 1 : 0);
      }
      if (filtros.bloqueado != null) {
        query += ' AND p.bloqueado = ?';
        params.push(filtros.bloqueado ? 1 : 0);
      }

      query += ' ORDER BY p.id DESC';
      const pag = this._paginacao(filtros);
      query += pag.sql;
      params.push(...pag.params);

      const rows = await sql.all(query, params);
      return rows.map(mapPerfilComercialFromRow);
    });
  }

  async inserir(dados) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      const result = await sql.run(
        `INSERT INTO ${PerfilComercialRepository.TABELA} (
          cliente_id, perfil_tipo, ativo, limite_comercial, saldo_aberto,
          bloqueado, motivo_bloqueio, score_confiabilidade, score_calculado_em,
          data_ativacao, data_inativacao, observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dados.clienteId,
          dados.perfilTipo,
          dados.ativo === false ? 0 : 1,
          dados.limiteComercial ?? 0,
          dados.saldoAberto ?? 0,
          dados.bloqueado ? 1 : 0,
          dados.motivoBloqueio ?? null,
          dados.scoreConfiabilidade ?? null,
          dados.scoreCalculadoEm ?? null,
          dados.dataAtivacao ?? null,
          dados.dataInativacao ?? null,
          dados.observacoes ?? null
        ]
      );

      return this.buscarPorId(result.lastID);
    });
  }

  async atualizar(id, dados) {
    return this._executar(async () => {
      const sql = this._obterSql();
      await sql.whenReady();

      const { sets, params } = this._montarCamposUpdate(
        dados,
        MAPA_CAMPOS,
        (c, v) => this._transformar(c, v)
      );
      if (!sets.length) {
        return this.buscarPorId(id);
      }

      sets.push('updated_at = CURRENT_TIMESTAMP');
      await sql.run(
        `UPDATE ${PerfilComercialRepository.TABELA} SET ${sets.join(', ')} WHERE id = ?`,
        [...params, id]
      );

      return this.buscarPorId(id);
    });
  }
}

module.exports = PerfilComercialRepository;
