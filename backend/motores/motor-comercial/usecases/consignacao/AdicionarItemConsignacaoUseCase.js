/**
 * UC-004 — AdicionarItemConsignacaoUseCase
 *
 * @class AdicionarItemConsignacaoUseCase
 */

const ConsignacaoWriteUseCase = require('./ConsignacaoWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const {
  DocumentoInvalidoError,
  ProdutoInvalidoError,
  ProdutoDuplicadoNaConsignacaoError,
  QuantidadeInvalidaError
} = require('../../domain/errors');
const {
  gerarCorrelationId,
  enfileirarEvento,
  obterConsignacaoEmRascunho
} = require('./consignacaoUseCaseHelpers');

class AdicionarItemConsignacaoUseCase extends ConsignacaoWriteUseCase {
  constructor(deps = {}) {
    super(deps);
    this._produtoBridge = deps.produtoBridge ?? null;
  }

  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
    if (!entrada?.produtoId) {
      throw new ProdutoInvalidoError(null, 'produtoId é obrigatório');
    }
    if (!Number.isFinite(Number(entrada.quantidade)) || Number(entrada.quantidade) <= 0) {
      throw new QuantidadeInvalidaError(entrada?.quantidade);
    }
    if (!this._produtoBridge) {
      throw new ProdutoInvalidoError(null, 'IProdutoBridge não configurado');
    }
  }

  async processar(entrada) {
    const produto = await this._produtoBridge.buscarPorId(entrada.produtoId);
    if (!produto) {
      throw new ProdutoInvalidoError(entrada.produtoId, 'Produto não encontrado');
    }

    const produtoAtivo = await this._produtoBridge.estaAtivo(entrada.produtoId);
    if (!produtoAtivo) {
      throw new ProdutoInvalidoError(entrada.produtoId, 'Produto inativo');
    }

    const quantidade = Number(entrada.quantidade);
    const precoUnitario = Number(entrada.precoUnitario ?? produto.preco ?? 0);
    const correlationId = entrada.correlationId ?? gerarCorrelationId();

    return this.executarEscrita(async (uow, eventos) => {
      const consignacao = await uow.consignacao.buscarPorId(entrada.consignacaoId);
      obterConsignacaoEmRascunho(consignacao);

      const itensExistentes = await uow.consignacaoItem.listarPorConsignacao(consignacao.id, {
        produtoId: entrada.produtoId
      });
      if (itensExistentes.length > 0) {
        throw new ProdutoDuplicadoNaConsignacaoError(consignacao.id, entrada.produtoId);
      }

      const item = await uow.consignacaoItem.inserir({
        consignacaoId: consignacao.id,
        produtoId: entrada.produtoId,
        quantidadeEntregue: quantidade,
        precoUnitario,
        subtotalEntregue: quantidade * precoUnitario
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.ITEM_CONSIGNACAO_ADICIONADO, consignacao.id, {
        consignacaoId: consignacao.id,
        item,
        correlationId
      }, correlationId);

      return { item, consignacaoId: consignacao.id, correlationId };
    });
  }
}

module.exports = AdicionarItemConsignacaoUseCase;
