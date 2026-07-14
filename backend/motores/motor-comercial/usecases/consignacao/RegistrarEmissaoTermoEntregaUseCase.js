/**
 * UC — RegistrarEmissaoTermoEntregaUseCase
 *
 * Registra emissão/reimpressão do Termo de Entrega no histórico da consignação.
 * Sprint S-6.3 — sem alteração de regras comerciais.
 *
 * @class RegistrarEmissaoTermoEntregaUseCase
 */

const ConsignacaoWriteUseCase = require('./ConsignacaoWriteUseCase');
const { DocumentoInvalidoError, ConsignacaoNaoEncontradaError } = require('../../domain/errors');
const { gerarCorrelationId } = require('./consignacaoUseCaseHelpers');
const {
  criarSnapshotConsignacao,
  registrarMovimentacaoComercial
} = require('./consignacaoOperacaoHelpers');

class RegistrarEmissaoTermoEntregaUseCase extends ConsignacaoWriteUseCase {
  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();
    const origem = entrada.origem ?? 'USUARIO';

    return this.executarEscrita(async (uow) => {
      const consignacao = await uow.consignacao.buscarPorId(entrada.consignacaoId);
      if (!consignacao) {
        throw new ConsignacaoNaoEncontradaError(entrada.consignacaoId);
      }

      const movimentacao = await registrarMovimentacaoComercial(uow, {
        consignacaoId: consignacao.id,
        tipoMovimentacao: 'TERMO_ENTREGA_EMITIDO',
        origem,
        correlationId,
        snapshot: criarSnapshotConsignacao(consignacao, { operacao: 'TERMO_ENTREGA_EMITIDO' }),
        usuarioId: entrada.usuarioId ?? null,
        motivo: 'Termo de Entrega emitido.',
        detalhes: {
          acao: entrada.acao ?? 'impressao',
          documento: consignacao.documento?.numero || consignacao.documento
        }
      });

      return { movimentacao, consignacao };
    });
  }
}

module.exports = RegistrarEmissaoTermoEntregaUseCase;
