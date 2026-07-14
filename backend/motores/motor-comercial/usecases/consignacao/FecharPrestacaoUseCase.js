/**
 * UC-024 — FecharPrestacaoUseCase
 *
 * @class FecharPrestacaoUseCase
 */

const ConsignacaoWriteUseCase = require('./ConsignacaoWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const { DocumentoInvalidoError, PrestacaoJaFechadaError } = require('../../domain/errors');
const { gerarCorrelationId, enfileirarEvento } = require('./consignacaoUseCaseHelpers');
const { registrarMovimentacaoComercial } = require('./consignacaoOperacaoHelpers');
const {
  garantirPrestacaoAberta,
  fecharGrupoPrestacaoContas,
  criarSnapshotPrestacao,
  calcularTotaisPrestacao,
  listarMovimentacoesPrestacao,
  determinarStatusAposFechamento,
  STATUS_ENCERRADA
} = require('./prestacaoOperacaoHelpers');
const { sincronizarCacheConsignacao } = require('../../services/projections/ledgerCacheSync');
const { sincronizarCreditoComercial } = require('../../services/sincronizarCreditoComercial');

class FecharPrestacaoUseCase extends ConsignacaoWriteUseCase {
  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();
    const origem = entrada.origem ?? 'USUARIO';

    return this.executarEscrita(async (uow, eventos) => {
      const consignacao = await uow.consignacao.buscarPorId(entrada.consignacaoId);
      const grupoAberto = garantirPrestacaoAberta(consignacao);

      if (grupoAberto.status === 'FECHADA') {
        throw new PrestacaoJaFechadaError(grupoAberto.id);
      }

      const itens = await uow.consignacaoItem.listarPorConsignacao(consignacao.id);
      const movimentacoes = await listarMovimentacoesPrestacao(uow, grupoAberto.id, consignacao.id);
      const totais = calcularTotaisPrestacao(movimentacoes, grupoAberto.id);
      const grupoFechado = fecharGrupoPrestacaoContas(grupoAberto);

      const snapshot = criarSnapshotPrestacao(
        consignacao,
        grupoFechado,
        itens,
        totais,
        { operacao: 'FECHAMENTO_PRESTACAO' }
      );

      const movimentacao = await registrarMovimentacaoComercial(uow, {
        consignacaoId: consignacao.id,
        tipoMovimentacao: 'FECHAMENTO_PRESTACAO',
        origem,
        correlationId,
        grupoPrestacaoContasId: grupoFechado.id,
        snapshot,
        usuarioId: entrada.usuarioId ?? null,
        valor: totais.saldo,
        motivo: entrada.motivo ?? 'Fechamento da prestação de contas'
      });

      let novoStatus = determinarStatusAposFechamento(totais);
      if (totais.saldo <= 0 && totais.totalVendido > 0) {
        novoStatus = STATUS_ENCERRADA;
      }

      const consignacaoAtualizada = await uow.consignacao.atualizar(consignacao.id, {
        status: novoStatus,
        prestacaoContasAtiva: grupoFechado
      });

      await sincronizarCacheConsignacao(uow, consignacao.id);

      const consignacaoComCache = await uow.consignacao.buscarPorId(consignacao.id);

      enfileirarEvento(eventos, EVENTOS_DOMINIO.PRESTACAO_FECHADA, consignacao.id, {
        consignacao: consignacaoComCache ?? consignacaoAtualizada,
        grupoPrestacaoContas: grupoFechado,
        movimentacao,
        totais,
        documento: grupoFechado.documento,
        correlationId
      }, correlationId);

      await sincronizarCreditoComercial(uow, eventos, consignacao, {
        origem: 'FECHAMENTO_PRESTACAO',
        correlationId,
        usuarioId: entrada.usuarioId ?? null
      });

      return {
        consignacao: consignacaoComCache ?? consignacaoAtualizada,
        grupoPrestacaoContas: grupoFechado,
        movimentacao,
        totais,
        correlationId
      };
    });
  }
}

module.exports = FecharPrestacaoUseCase;
