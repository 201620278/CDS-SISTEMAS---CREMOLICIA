/**
 * UC-003 — CancelarConsignacaoRascunhoUseCase
 *
 * @class CancelarConsignacaoRascunhoUseCase
 */

const ConsignacaoWriteUseCase = require('./ConsignacaoWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const { DocumentoInvalidoError } = require('../../domain/errors');
const {
  STATUS_CANCELADA,
  gerarCorrelationId,
  enfileirarEvento,
  obterConsignacaoEmRascunho
} = require('./consignacaoUseCaseHelpers');

class CancelarConsignacaoRascunhoUseCase extends ConsignacaoWriteUseCase {
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

      const consignacao = await uow.consignacao.atualizar(atual.id, {
        status: STATUS_CANCELADA,
        documento: {
          ...atual.documento,
          situacao: 'CANCELADO'
        }
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.CONSIGNACAO_CANCELADA, consignacao.id, {
        consignacao,
        motivo: entrada.motivo ?? null,
        correlationId
      }, correlationId);

      return { consignacao, correlationId };
    });
  }
}

module.exports = CancelarConsignacaoRascunhoUseCase;
