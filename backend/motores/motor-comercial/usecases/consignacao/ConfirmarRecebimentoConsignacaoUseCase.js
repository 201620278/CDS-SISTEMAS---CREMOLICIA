/**
 * UC-014 — ConfirmarRecebimentoConsignacaoUseCase
 *
 * @class ConfirmarRecebimentoConsignacaoUseCase
 */

const ConsignacaoWriteUseCase = require('./ConsignacaoWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const { DocumentoInvalidoError } = require('../../domain/errors');
const { gerarCorrelationId, enfileirarEvento } = require('./consignacaoUseCaseHelpers');
const { obterConsignacaoEntregue } = require('./consignacaoOperacaoHelpers');

class ConfirmarRecebimentoConsignacaoUseCase extends ConsignacaoWriteUseCase {
  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();
    const confirmadoEm = entrada.confirmadoEm ?? new Date().toISOString();

    return this.executarEscrita(async (uow, eventos) => {
      const consignacao = await uow.consignacao.buscarPorId(entrada.consignacaoId);
      obterConsignacaoEntregue(consignacao);

      enfileirarEvento(eventos, EVENTOS_DOMINIO.RECEBIMENTO_CONSIGNACAO_CONFIRMADO, consignacao.id, {
        consignacaoId: consignacao.id,
        confirmadoEm,
        usuarioId: entrada.usuarioId ?? null,
        observacao: entrada.observacao ?? null,
        correlationId
      }, correlationId);

      return {
        consignacaoId: consignacao.id,
        confirmadoEm,
        correlationId
      };
    });
  }
}

module.exports = ConfirmarRecebimentoConsignacaoUseCase;
