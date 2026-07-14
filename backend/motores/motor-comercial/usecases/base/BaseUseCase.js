/**
 * BaseUseCase — Padronização de execução dos casos de uso.
 *
 * Sprint 2.2.5: template method — sem regras comerciais.
 *
 * @abstract
 * @class BaseUseCase
 */

const Result = require('../../infrastructure/result/Result');

class BaseUseCase {
  /**
   * @param {Object} [deps]
   */
  constructor(deps = {}) {
    if (new.target === BaseUseCase) {
      throw new Error('BaseUseCase é abstrata e não pode ser instanciada diretamente');
    }

    this._deps = deps;
    this._unitOfWork = deps.unitOfWork ?? null;
    this._eventPublisher = deps.eventPublisher ?? null;
    this._outboxService = deps.outboxService ?? null;
  }

  /**
   * Ponto de entrada do caso de uso.
   *
   * @param {Object} entrada
   * @returns {Promise<Result>}
   */
  async executar(entrada) {
    try {
      await this.validar(entrada);
      await this.autorizar(entrada);
      const dados = await this.processar(entrada);
      return this.responder(dados);
    } catch (err) {
      return this.responderErro(err);
    }
  }

  /**
   * @abstract
   * @param {Object} _entrada
   * @returns {Promise<void>}
   */
  async validar(_entrada) {
    // subclasses implementam validações
  }

  /**
   * @abstract
   * @param {Object} _entrada
   * @returns {Promise<void>}
   */
  async autorizar(_entrada) {
    // subclasses implementam autorização
  }

  /**
   * @abstract
   * @param {Object} _entrada
   * @returns {Promise<*>}
   */
  async processar(_entrada) {
    throw new Error(`${this.constructor.name} deve implementar processar()`);
  }

  /**
   * @param {*} dados
   * @param {string[]} [mensagens]
   * @returns {Result}
   */
  responder(dados, mensagens = []) {
    return Result.ok(dados, mensagens);
  }

  /**
   * @param {Error} erro
   * @returns {Result}
   */
  responderErro(erro) {
    return Result.fail(erro);
  }

  /**
   * @returns {import('../../infrastructure/transactions/UnitOfWork')|null}
   */
  obterUnitOfWork() {
    return this._unitOfWork;
  }

  /**
   * @returns {import('../../infrastructure/events/EventPublisher')|null}
   */
  obterEventPublisher() {
    return this._eventPublisher;
  }

  /**
   * @returns {import('../../../../shared/outbox/OutboxService')|null}
   */
  obterOutboxService() {
    return this._outboxService;
  }
}

module.exports = BaseUseCase;
