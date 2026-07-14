/**
 * TimelineProjectionService — Timeline cronológica reconstruída pelo Ledger.
 *
 * @class TimelineProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const TimelineDTO = require('../../dto/TimelineDTO');
const ProjectionContext = require('./ProjectionContext');
const { DocumentoInvalidoError } = require('../../domain/errors');
const {
  ordenarCronologicamente,
  paginar,
  mapearEventoTimeline,
  listarMovimentacoesComerciais
} = require('./projectionHelpers');

class TimelineProjectionService extends BaseProjectionService {
  _possuiEscopo(contexto) {
    return contexto.consignacaoId != null
      || contexto.clienteId != null
      || contexto.perfilComercialId != null;
  }

  async validar(contexto) {
    if (!this._movimentacaoComercialRepository) {
      throw new DocumentoInvalidoError('IMovimentacaoComercialRepository não configurado');
    }
  }

  async consultar(contexto) {
    if (!this._possuiEscopo(contexto)) {
      return [];
    }

    if (contexto.consignacaoId != null) {
      return listarMovimentacoesComerciais(this._movimentacaoComercialRepository, contexto);
    }

    if (!this._consignacaoRepository) {
      return listarMovimentacoesComerciais(this._movimentacaoComercialRepository, contexto);
    }

    const filtrosConsignacao = {
      documentoNumero: contexto.documentoNumero ?? undefined
    };
    if (contexto.clienteId != null) filtrosConsignacao.clienteId = contexto.clienteId;
    if (contexto.perfilComercialId != null) filtrosConsignacao.perfilComercialId = contexto.perfilComercialId;

    const consignacoes = await this._consignacaoRepository.listar(filtrosConsignacao);
    const porConsignacao = await Promise.all(
      consignacoes.map((c) => listarMovimentacoesComerciais(
        this._movimentacaoComercialRepository,
        ProjectionContext.create({ ...contexto.toJSON(), consignacaoId: c.id })
      ))
    );
    return porConsignacao.flat();
  }

  async projetar(movimentacoes, contexto) {
    const ordenadas = ordenarCronologicamente(movimentacoes, contexto.ordenacao);
    const eventos = ordenadas.map(mapearEventoTimeline);
    const { itens, paginacao } = paginar(eventos, contexto.limite, contexto.offset);

    const dto = TimelineDTO.create({
      consignacaoId: contexto.consignacaoId,
      eventos: itens
    });

    return {
      dados: dto.toJSON(),
      paginacao,
      totais: { totalEventos: eventos.length }
    };
  }
}

module.exports = TimelineProjectionService;
