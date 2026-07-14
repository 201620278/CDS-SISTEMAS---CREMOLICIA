/**
 * UC-025 — ReabrirPrestacaoUseCase
 *
 * @class ReabrirPrestacaoUseCase
 */

const ConsignacaoWriteUseCase = require('./ConsignacaoWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const {
  DocumentoInvalidoError,
  ConsignacaoNaoEncontradaError,
  ReaberturaNaoAutorizadaError
} = require('../../domain/errors');
const { gerarCorrelationId, enfileirarEvento, STATUS_ENTREGUE } = require('./consignacaoUseCaseHelpers');
const { registrarMovimentacaoComercial } = require('./consignacaoOperacaoHelpers');
const {
  criarGrupoPrestacaoContas,
  criarSnapshotPrestacao,
  calcularTotaisPrestacao,
  listarMovimentacoesPrestacao,
  garantirPrestacaoFechada,
  STATUS_ACERTADA
} = require('./prestacaoOperacaoHelpers');

class ReabrirPrestacaoUseCase extends ConsignacaoWriteUseCase {
  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
    if (!entrada?.liberacaoGerencial) {
      throw new ReaberturaNaoAutorizadaError({ motivo: 'Liberação gerencial obrigatória' });
    }
  }

  async autorizar(entrada) {
    if (!entrada.liberacaoGerencial?.autorizado) {
      throw new ReaberturaNaoAutorizadaError({
        motivo: 'Liberação gerencial não autorizada',
        liberacao: entrada.liberacaoGerencial
      });
    }
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();
    const origem = entrada.origem ?? 'USUARIO';

    return this.executarEscrita(async (uow, eventos) => {
      const consignacao = await uow.consignacao.buscarPorId(entrada.consignacaoId);
      if (!consignacao) {
        throw new ConsignacaoNaoEncontradaError(entrada.consignacaoId);
      }

      if (consignacao.status !== STATUS_ACERTADA) {
        throw new ReaberturaNaoAutorizadaError({
          motivo: 'Reabertura permitida apenas para consignação ACERTADA',
          statusAtual: consignacao.status
        });
      }

      const grupoAnterior = garantirPrestacaoFechada(consignacao);
      const itens = await uow.consignacaoItem.listarPorConsignacao(consignacao.id);
      const movimentacoesAnteriores = await listarMovimentacoesPrestacao(
        uow,
        grupoAnterior.id,
        consignacao.id
      );
      const totaisAnteriores = calcularTotaisPrestacao(movimentacoesAnteriores, grupoAnterior.id);

      const grupoReaberto = criarGrupoPrestacaoContas(consignacao, {
        ...grupoAnterior.documento,
        numero: entrada.documento?.numero ?? `PC-REAB-${consignacao.id}-${Date.now()}`
      });

      const snapshot = criarSnapshotPrestacao(
        { ...consignacao, status: STATUS_ENTREGUE },
        grupoReaberto,
        itens,
        totaisAnteriores,
        {
          operacao: 'REABERTURA_PRESTACAO',
          grupoAnteriorId: grupoAnterior.id,
          liberacaoGerencial: entrada.liberacaoGerencial
        }
      );

      const movimentacao = await registrarMovimentacaoComercial(uow, {
        consignacaoId: consignacao.id,
        tipoMovimentacao: 'REABERTURA_PRESTACAO',
        origem,
        correlationId,
        grupoPrestacaoContasId: grupoReaberto.id,
        snapshot,
        usuarioId: entrada.usuarioId ?? null,
        motivo: entrada.motivo ?? 'Reabertura excepcional da prestação',
        detalhes: {
          grupoAnteriorId: grupoAnterior.id,
          liberacaoGerencial: entrada.liberacaoGerencial
        }
      });

      const consignacaoAtualizada = await uow.consignacao.atualizar(consignacao.id, {
        status: STATUS_ENTREGUE,
        prestacaoContasAtiva: grupoReaberto
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.PRESTACAO_REABERTA, consignacao.id, {
        consignacao: consignacaoAtualizada,
        grupoPrestacaoContas: grupoReaberto,
        grupoAnterior,
        movimentacao,
        liberacaoGerencial: entrada.liberacaoGerencial,
        correlationId
      }, correlationId);

      return {
        consignacao: consignacaoAtualizada,
        grupoPrestacaoContas: grupoReaberto,
        movimentacao,
        correlationId
      };
    });
  }
}

module.exports = ReabrirPrestacaoUseCase;
