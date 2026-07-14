/**
 * UC-002 — EditarConsignacaoUseCase
 *
 * @class EditarConsignacaoUseCase
 */

const ConsignacaoWriteUseCase = require('./ConsignacaoWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const { DocumentoInvalidoError } = require('../../domain/errors');
const {
  gerarCorrelationId,
  enfileirarEvento,
  obterConsignacaoEmRascunho
} = require('./consignacaoUseCaseHelpers');

class EditarConsignacaoUseCase extends ConsignacaoWriteUseCase {
  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();

    return this.executarEscrita(async (uow, eventos) => {
      const atual = await uow.consignacao.buscarPorId(entrada.consignacaoId);
      obterConsignacaoEmRascunho(atual);

      const dadosAtualizacao = {};
      if (entrada.observacao !== undefined) dadosAtualizacao.observacao = entrada.observacao;
      if (entrada.dataAbertura !== undefined) dadosAtualizacao.dataAbertura = entrada.dataAbertura;
      if (entrada.dataEntregaPrevista !== undefined) {
        dadosAtualizacao.dataEntrega = entrada.dataEntregaPrevista;
      }
      if (entrada.documentoExterno !== undefined) {
        dadosAtualizacao.documentoExterno = entrada.documentoExterno;
      }
      if (entrada.informacoesComplementares !== undefined) {
        dadosAtualizacao.observacao = entrada.informacoesComplementares;
      }

      const consignacao = await uow.consignacao.atualizar(atual.id, dadosAtualizacao);

      enfileirarEvento(eventos, EVENTOS_DOMINIO.CONSIGNACAO_ATUALIZADA, consignacao.id, {
        consignacao,
        alteracoes: dadosAtualizacao,
        correlationId
      }, correlationId);

      return { consignacao, correlationId };
    });
  }
}

module.exports = EditarConsignacaoUseCase;
