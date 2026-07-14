/**
 * PerfilWriteUseCase — Base para casos de uso com escrita no PerfilComercial.
 *
 * @abstract
 * @class PerfilWriteUseCase
 * @extends BaseUseCase
 */

const BaseUseCase = require('../base/BaseUseCase');
const { MovimentacaoInvalidaError } = require('../../domain/errors');

class PerfilWriteUseCase extends BaseUseCase {
  /**
   * @param {Function} operacao
   * @returns {Promise<*>}
   */
  async executarEscrita(operacao) {
    const uow = this.obterUnitOfWork();
    if (!uow) {
      throw new MovimentacaoInvalidaError('UnitOfWork não configurado');
    }

    const eventos = [];
    const resultado = await uow.executar(async (tx) => operacao(tx, eventos));
    await this._publicarEventosAposCommit(eventos);
    return resultado;
  }

  /**
   * @private
   * @param {import('../../domain/events/DomainEvent')[]} eventos
   * @returns {Promise<void>}
   */
  async _publicarEventosAposCommit(eventos) {
    const publisher = this.obterEventPublisher();
    if (!publisher || !eventos.length) return;

    eventos.forEach((evento) => publisher.publicar(evento));
    await publisher.flush();
  }
}

module.exports = PerfilWriteUseCase;
