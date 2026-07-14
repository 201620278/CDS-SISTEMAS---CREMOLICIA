/**
 * UC-005 — RemoverItemConsignacaoUseCase
 *
 * @class RemoverItemConsignacaoUseCase
 */

const ConsignacaoWriteUseCase = require('./ConsignacaoWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const {
  DocumentoInvalidoError,
  ProdutoNaoEncontradoNaConsignacaoError
} = require('../../domain/errors');
const {
  gerarCorrelationId,
  enfileirarEvento,
  obterConsignacaoEmRascunho
} = require('./consignacaoUseCaseHelpers');

class RemoverItemConsignacaoUseCase extends ConsignacaoWriteUseCase {
  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
    if (!entrada?.itemId && !entrada?.produtoId) {
      throw new DocumentoInvalidoError('itemId ou produtoId é obrigatório');
    }
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();

    return this.executarEscrita(async (uow, eventos) => {
      const consignacao = await uow.consignacao.buscarPorId(entrada.consignacaoId);
      obterConsignacaoEmRascunho(consignacao);

      let item = null;
      if (entrada.itemId) {
        item = await uow.consignacaoItem.buscarPorId(entrada.itemId);
      } else {
        const itens = await uow.consignacaoItem.listarPorConsignacao(consignacao.id, {
          produtoId: entrada.produtoId
        });
        item = itens[0] ?? null;
      }

      if (!item || item.consignacaoId !== consignacao.id) {
        throw new ProdutoNaoEncontradoNaConsignacaoError(
          consignacao.id,
          entrada.produtoId ?? entrada.itemId
        );
      }

      await uow.consignacaoItem.remover(item.id);

      enfileirarEvento(eventos, EVENTOS_DOMINIO.ITEM_CONSIGNACAO_REMOVIDO, consignacao.id, {
        consignacaoId: consignacao.id,
        item,
        correlationId
      }, correlationId);

      return { item, consignacaoId: consignacao.id, correlationId };
    });
  }
}

module.exports = RemoverItemConsignacaoUseCase;
