/**
 * BaseRepository — Operações comuns de persistência.
 *
 * Sprint 2.2.5: helpers e tratamento de erros — sem regras comerciais.
 *
 * @abstract
 * @class BaseRepository
 */

const {
  resolverDb,
  criarDbHelpers,
  montarCamposUpdate,
  paginacao,
  serializarJson,
  deserializarJson
} = require('../../repositories/dbHelpers');

class BaseRepository {
  /**
   * @param {Object} [deps]
   * @param {Object} [deps.db]
   */
  constructor(deps = {}) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository é abstrata e não pode ser instanciada diretamente');
    }

    this._db = deps.db ?? null;
    this._sql = null;
  }

  /**
   * @returns {import('../../repositories/dbHelpers')}
   */
  _obterSql() {
    if (!this._sql) {
      this._sql = criarDbHelpers(resolverDb(this._db));
    }
    return this._sql;
  }

  /**
   * @param {Function} operacao
   * @returns {Promise<*>}
   */
  async _executar(operacao) {
    try {
      return await operacao();
    } catch (err) {
      throw this._tratarErroPersistencia(err);
    }
  }

  /**
   * @param {Error} err
   * @returns {Error}
   */
  _tratarErroPersistencia(err) {
    const erro = new Error(err.message || 'Erro de persistência');
    erro.name = 'PersistenciaError';
    erro.codigo = err.code ?? 'PERSISTENCIA_ERROR';
    erro.causa = err;
    return erro;
  }

  /**
   * @param {Object} dados
   * @param {Object} mapa
   * @param {Function} [transformar]
   * @returns {{ sets: string[], params: unknown[] }}
   */
  _montarCamposUpdate(dados, mapa, transformar) {
    return montarCamposUpdate(dados, mapa, transformar);
  }

  /**
   * @param {Object} [filtros]
   * @returns {{ sql: string, params: unknown[] }}
   */
  _paginacao(filtros) {
    return paginacao(filtros);
  }

  /**
   * @param {*} valor
   * @returns {string|null}
   */
  _serializarJson(valor) {
    return serializarJson(valor);
  }

  /**
   * @param {*} valor
   * @returns {Object|null}
   */
  _deserializarJson(valor) {
    return deserializarJson(valor);
  }

  /**
   * @param {Object} dados
   * @returns {Promise<Object>}
   */
  async salvar(dados) {
    if (dados?.id != null) {
      return this.atualizar(dados.id, dados);
    }
    return this.inserir(dados);
  }
}

BaseRepository.paginacao = paginacao;
BaseRepository.montarCamposUpdate = montarCamposUpdate;
BaseRepository.serializarJson = serializarJson;
BaseRepository.deserializarJson = deserializarJson;

module.exports = BaseRepository;
