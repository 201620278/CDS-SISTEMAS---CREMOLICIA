/**
 * ResumoPrestacaoProjectionService — Reconstrói resumo da prestação pelo Ledger.
 *
 * @class ResumoPrestacaoProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const ResumoPrestacaoDTO = require('../../dto/ResumoPrestacaoDTO');
const { DocumentoInvalidoError, ConsignacaoNaoEncontradaError } = require('../../domain/errors');
const {
  calcularTotaisPrestacao,
  listarMovimentacoesComerciais
} = require('./projectionHelpers');

class ResumoPrestacaoProjectionService extends BaseProjectionService {
  async validar(contexto) {
    if (contexto.consignacaoId == null) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório para Resumo da Prestação');
    }
    if (!this._movimentacaoComercialRepository) {
      throw new DocumentoInvalidoError('IMovimentacaoComercialRepository não configurado');
    }
  }

  async consultar(contexto) {
    const [movimentacoes, consignacao] = await Promise.all([
      listarMovimentacoesComerciais(this._movimentacaoComercialRepository, contexto),
      this._consignacaoRepository?.buscarPorId(contexto.consignacaoId) ?? null
    ]);
    return { movimentacoes, consignacao };
  }

  async projetar({ movimentacoes, consignacao }, contexto) {
    if (!consignacao) {
      throw new ConsignacaoNaoEncontradaError(contexto.consignacaoId);
    }

    const grupoId = contexto.grupoPrestacaoContasId
      ?? consignacao.prestacaoContasAtiva?.id
      ?? null;

    const totais = calcularTotaisPrestacao(movimentacoes, grupoId);
    const grupo = consignacao.prestacaoContasAtiva;

    const dto = ResumoPrestacaoDTO.create({
      consignacaoId: consignacao.id,
      grupoPrestacaoContasId: grupoId,
      documento: grupo?.documento ?? consignacao.documento,
      grupoPrestacaoContas: grupo,
      totalVendido: totais.totalVendido,
      totalDevolvido: totais.totalDevolvido,
      totalPerdido: totais.totalPerdido,
      totalCortesia: totais.totalCortesia,
      totalPago: totais.totalRecebido,
      saldo: totais.saldo
    });

    return {
      dados: dto.toJSON(),
      totais
    };
  }
}

module.exports = ResumoPrestacaoProjectionService;
