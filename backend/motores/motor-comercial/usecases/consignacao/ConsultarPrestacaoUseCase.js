/**
 * UC-026 — ConsultarPrestacaoUseCase
 *
 * @class ConsultarPrestacaoUseCase
 */

const ConsignacaoReadUseCase = require('./ConsignacaoReadUseCase');
const { DocumentoInvalidoError, PrestacaoNaoAbertaError } = require('../../domain/errors');
const { calcularTotaisPrestacao } = require('./prestacaoOperacaoHelpers');
const { prestacaoEstaAberta } = require('./consignacaoOperacaoHelpers');

class ConsultarPrestacaoUseCase extends ConsignacaoReadUseCase {
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

    if (!prestacao || (!prestacaoEstaAberta(consignacao) && prestacao.status !== 'FECHADA')) {
      throw new PrestacaoNaoAbertaError(consignacao.id);
    }

    const grupoId = prestacao.id;
    const movimentacoes = await this._movimentacaoComercialRepository.listar({
      consignacaoId: consignacao.id,
      grupoPrestacaoContasId: grupoId
    });

    const totais = calcularTotaisPrestacao(movimentacoes, grupoId);

    return {
      consignacaoId: consignacao.id,
      status: consignacao.status,
      prestacaoStatus: prestacao.status,
      documento: prestacao.documento ?? consignacao.documento,
      grupoPrestacaoContas: prestacao,
      movimentacoes,
      totais
    };
  }
}

module.exports = ConsultarPrestacaoUseCase;
