/**
 * IndicadoresProjectionService — Indicadores derivados do Ledger.
 *
 * @class IndicadoresProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const IndicadoresDTO = require('../../dto/IndicadoresDTO');
const ProjectionContext = require('./ProjectionContext');
const { DocumentoInvalidoError } = require('../../domain/errors');
const {
  calcularIndicadoresComerciais,
  listarMovimentacoesComerciais
} = require('./projectionHelpers');

class IndicadoresProjectionService extends BaseProjectionService {
  async validar(contexto) {
    if (!this._movimentacaoComercialRepository) {
      throw new DocumentoInvalidoError('IMovimentacaoComercialRepository não configurado');
    }
  }

  async consultar(contexto) {
    if (contexto.consignacaoId != null) {
      return listarMovimentacoesComerciais(this._movimentacaoComercialRepository, contexto);
    }

    if (contexto.clienteId != null) {
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

    return this._movimentacaoComercialRepository.listar(contexto.toFiltrosComercial());
  }

  async projetar(movimentacoes, _contexto) {
    const indicadores = calcularIndicadoresComerciais(movimentacoes);
    const dto = IndicadoresDTO.create(indicadores);

    return {
      dados: dto.toJSON(),
      indicadores
    };
  }
}

module.exports = IndicadoresProjectionService;
