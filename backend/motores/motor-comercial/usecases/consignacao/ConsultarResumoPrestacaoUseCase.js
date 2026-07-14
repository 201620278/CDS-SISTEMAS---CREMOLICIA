/**
 * UC-027 — ConsultarResumoPrestacaoUseCase
 *
 * @class ConsultarResumoPrestacaoUseCase
 */

const ConsignacaoReadUseCase = require('./ConsignacaoReadUseCase');
const { DocumentoInvalidoError, PrestacaoNaoAbertaError } = require('../../domain/errors');
const { calcularTotaisPrestacao } = require('./prestacaoOperacaoHelpers');

class ConsultarResumoPrestacaoUseCase extends ConsignacaoReadUseCase {
  constructor(deps = {}) {
    super(deps);
    this._movimentacaoComercialRepository = deps.movimentacaoComercialRepository ?? null;
  }

  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
    if (!this._movimentacaoComercialRepository) {
      throw new DocumentoInvalidoError('IMovimentacaoComercialRepository não configurado');
    }
  }

  async processar(entrada) {
    const consignacao = await this._obterConsignacaoOuFalhar(entrada.consignacaoId);
    const prestacao = consignacao.prestacaoContasAtiva;

    if (!prestacao) {
      throw new PrestacaoNaoAbertaError(consignacao.id);
    }

    const grupoId = entrada.grupoPrestacaoContasId ?? prestacao.id;
    const movimentacoes = await this._movimentacaoComercialRepository.listar({
      consignacaoId: consignacao.id,
      grupoPrestacaoContasId: grupoId
    });

    const resumo = calcularTotaisPrestacao(movimentacoes, grupoId);

    return {
      consignacaoId: consignacao.id,
      grupoPrestacaoContasId: grupoId,
      statusConsignacao: consignacao.status,
      prestacaoStatus: prestacao.id === grupoId ? prestacao.status : null,
      resumo: {
        totalVendido: resumo.totalVendido,
        totalDevolvido: resumo.totalDevolvido,
        totalPerdido: resumo.totalPerdido,
        totalCortesia: resumo.totalCortesia,
        totalRecebido: resumo.totalRecebido,
        saldo: resumo.saldo
      },
      derivadoDoLedger: true,
      quantidadeMovimentacoes: resumo.quantidadeMovimentacoes
    };
  }
}

module.exports = ConsultarResumoPrestacaoUseCase;
