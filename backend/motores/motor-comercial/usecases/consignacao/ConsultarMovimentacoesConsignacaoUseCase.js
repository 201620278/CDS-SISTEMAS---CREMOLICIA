/**
 * UC-016 — ConsultarMovimentacoesConsignacaoUseCase
 *
 * @class ConsultarMovimentacoesConsignacaoUseCase
 */

const ConsignacaoReadUseCase = require('./ConsignacaoReadUseCase');
const { DocumentoInvalidoError } = require('../../domain/errors');

class ConsultarMovimentacoesConsignacaoUseCase extends ConsignacaoReadUseCase {
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
    await this._obterConsignacaoOuFalhar(entrada.consignacaoId);

    const movimentacoes = await this._movimentacaoComercialRepository.listar({
      consignacaoId: entrada.consignacaoId,
      tipoMovimentacao: entrada.tipoMovimentacao,
      correlationId: entrada.correlationId,
      dataInicio: entrada.dataInicio,
      dataFim: entrada.dataFim,
      limite: entrada.limite,
      offset: entrada.offset
    });

    return {
      consignacaoId: entrada.consignacaoId,
      movimentacoes,
      total: movimentacoes.length
    };
  }
}

module.exports = ConsultarMovimentacoesConsignacaoUseCase;
