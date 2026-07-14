/**
 * SaldoProjectionService — Calcula saldos derivados do Ledger.
 *
 * @class SaldoProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const ProjectionContext = require('./ProjectionContext');
const { DocumentoInvalidoError } = require('../../domain/errors');
const {
  calcularSaldosComerciais,
  listarMovimentacoesComerciais
} = require('./projectionHelpers');

class SaldoProjectionService extends BaseProjectionService {
  async validar(contexto) {
    if (contexto.consignacaoId == null && contexto.clienteId == null) {
      throw new DocumentoInvalidoError('consignacaoId ou clienteId é obrigatório para Saldos');
    }
    if (!this._movimentacaoComercialRepository) {
      throw new DocumentoInvalidoError('IMovimentacaoComercialRepository não configurado');
    }
  }

  async consultar(contexto) {
    if (contexto.consignacaoId != null) {
      return listarMovimentacoesComerciais(this._movimentacaoComercialRepository, contexto);
    }

    const consignacoes = await this._consignacaoRepository?.listar({
      clienteId: contexto.clienteId
    }) ?? [];

    const movimentacoesPorConsignacao = await Promise.all(
      consignacoes.map((c) => listarMovimentacoesComerciais(
        this._movimentacaoComercialRepository,
        ProjectionContext.create({ ...contexto.toJSON(), consignacaoId: c.id })
      ))
    );

    return movimentacoesPorConsignacao.flat();
  }

  async projetar(movimentacoes, contexto) {
    const saldos = calcularSaldosComerciais(movimentacoes);

    return {
      dados: {
        escopo: contexto.consignacaoId != null ? 'CONSIGNACAO' : 'CLIENTE',
        consignacaoId: contexto.consignacaoId,
        clienteId: contexto.clienteId,
        saldos
      },
      totais: saldos
    };
  }
}

module.exports = SaldoProjectionService;
