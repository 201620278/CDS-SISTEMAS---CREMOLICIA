/**
 * ConsignacaoWriteUseCase — Base para casos de uso com escrita na Consignacao.
 *
 * @abstract
 * @class ConsignacaoWriteUseCase
 */

const BaseUseCase = require('../base/BaseUseCase');
const { MovimentacaoInvalidaError } = require('../../domain/errors');

class ConsignacaoWriteUseCase extends BaseUseCase {
  /**
   * @param {Function} operacao
   * @returns {Promise<*>}
   */
  async executarEscrita(operacao) {
    const uow = this.obterUnitOfWork();
    if (!uow) {
      throw new MovimentacaoInvalidaError('UnitOfWork não configurado');
    }

    const outboxService = this.obterOutboxService();
    const eventos = [];
    const outboxIds = [];

    const outboxEnqueue = outboxService
      ? async (evento) => {
          const registrado = await outboxService.enfileirar(uow, evento);
          if (registrado?.id != null) {
            outboxIds.push(registrado.id);
          }
          return registrado;
        }
      : null;

    const resultado = await uow.executar(async (tx) => operacao(tx, eventos, outboxEnqueue));

    // Commit já confirmou o domínio. Falha em eventos/outbox NÃO deve
    // invalidar a resposta HTTP — senão o cliente trata ENTREGUE como erro
    // e a UI do Electron permanece na mesma tela.
    try {
      await this._publicarEventosAposCommit(eventos);
    } catch (err) {
      console.warn('[ConsignacaoWriteUseCase] falha ao publicar eventos pós-commit:', err?.message || err);
    }

    // Outbox (estoque/bridges) com retry/backoff NÃO pode segurar a resposta HTTP —
    // era o que deixava o botão "Processando..." minutos na tela de entrega.
    this._agendarOutboxAposCommit(outboxService, outboxIds);

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

  /**
   * Dispara processamento do outbox sem bloquear a resposta HTTP.
   * @private
   * @param {import('../../../../shared/outbox/OutboxService')|null} outboxService
   * @param {number[]} outboxIds
   * @returns {void}
   */
  _agendarOutboxAposCommit(outboxService, outboxIds) {
    if (!outboxService || !outboxIds.length) return;

    const executar = () => {
      outboxService.processarAposCommit(outboxIds).catch((err) => {
        console.warn(
          '[ConsignacaoWriteUseCase] outbox pós-commit (async):',
          err?.message || err
        );
      });
    };

    if (typeof setImmediate === 'function') {
      setImmediate(executar);
    } else {
      setTimeout(executar, 0);
    }
  }
}

module.exports = ConsignacaoWriteUseCase;
