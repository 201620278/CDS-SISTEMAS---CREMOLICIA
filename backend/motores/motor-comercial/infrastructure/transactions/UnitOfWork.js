/**
 * UnitOfWork — Coordena transações e repositories.
 *
 * Sprint 2.2.5: toda operação multi-aggregate deve usar UnitOfWork.
 *
 * @class UnitOfWork
 */

const TransactionManager = require('../transactions/TransactionManager');
const RepositoryFactory = require('../factories/RepositoryFactory');

class UnitOfWork {
  /**
   * @param {Object} [deps]
   * @param {TransactionManager} [deps.transactionManager]
   * @param {RepositoryFactory} [deps.repositoryFactory]
   */
  constructor(deps = {}) {
    this._transactionManager = deps.transactionManager ?? new TransactionManager(deps);
    this._repositoryFactory = deps.repositoryFactory ?? new RepositoryFactory(deps);
    this._dbTransacional = null;
    this._repositories = null;
  }

  /**
   * @private
   * @returns {Object}
   */
  _obterRepositories() {
    if (!this._repositories) {
      const db = this._dbTransacional;
      this._repositories = {
        perfilComercial: this._repositoryFactory.criarPerfilComercialRepository({ db }),
        consignacao: this._repositoryFactory.criarConsignacaoRepository({ db }),
        consignacaoItem: this._repositoryFactory.criarConsignacaoItemRepository({ db }),
        movimentacaoComercial: this._repositoryFactory.criarMovimentacaoComercialRepository({ db }),
        movimentacaoPerfil: this._repositoryFactory.criarMovimentacaoPerfilRepository({ db })
      };
    }
    return this._repositories;
  }

  get perfilComercial() {
    return this._obterRepositories().perfilComercial;
  }

  get consignacao() {
    return this._obterRepositories().consignacao;
  }

  get consignacaoItem() {
    return this._obterRepositories().consignacaoItem;
  }

  get movimentacaoComercial() {
    return this._obterRepositories().movimentacaoComercial;
  }

  get movimentacaoPerfil() {
    return this._obterRepositories().movimentacaoPerfil;
  }

  /**
   * @returns {Promise<void>}
   */
  async iniciar() {
    this._dbTransacional = await this._transactionManager.iniciar();
    this._repositories = null;
  }

  /**
   * @returns {Promise<void>}
   */
  async commit() {
    await this._transactionManager.confirmar();
    this._dbTransacional = null;
    this._repositories = null;
  }

  /**
   * @returns {Promise<void>}
   */
  async rollback() {
    await this._transactionManager.cancelar();
    this._dbTransacional = null;
    this._repositories = null;
  }

  /**
   * @returns {boolean}
   */
  isAtiva() {
    return this._transactionManager.isEmTransacao();
  }

  /**
   * Retorna handle SQLite da transação ativa (para Outbox na mesma transação).
   * @returns {Object|null}
   */
  obterDbTransacional() {
    return this._dbTransacional;
  }

  /**
   * @param {Function} operacao
   * @returns {Promise<*>}
   */
  async executar(operacao) {
    await this.iniciar();
    try {
      const resultado = await operacao(this);
      await this.commit();
      return resultado;
    } catch (err) {
      await this.rollback();
      throw err;
    }
  }
}

module.exports = UnitOfWork;
