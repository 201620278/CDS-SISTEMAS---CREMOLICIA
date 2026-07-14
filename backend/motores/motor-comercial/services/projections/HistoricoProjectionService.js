/**
 * HistoricoProjectionService — Histórico comercial reconstruído pelo Ledger.
 *
 * @class HistoricoProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const HistoricoDTO = require('../../dto/HistoricoDTO');
const ProjectionContext = require('./ProjectionContext');
const { DocumentoInvalidoError } = require('../../domain/errors');
const {
  ordenarCronologicamente,
  paginar,
  listarMovimentacoesComerciais,
  listarMovimentacoesPerfil
} = require('./projectionHelpers');

class HistoricoProjectionService extends BaseProjectionService {
  async validar(contexto) {
    if (!this._movimentacaoComercialRepository && !this._movimentacaoPerfilRepository) {
      throw new DocumentoInvalidoError('Pelo menos um repositório de ledger deve estar configurado');
    }
  }

  async consultar(contexto) {
    let movimentacoesComerciais = [];
    let movimentacoesPerfil = [];

    if (contexto.consignacaoId != null || contexto.clienteId != null || !contexto.perfilComercialId) {
      if (contexto.clienteId != null && contexto.consignacaoId == null && this._consignacaoRepository) {
        const consignacoes = await this._consignacaoRepository.listar({
          clienteId: contexto.clienteId,
          documentoNumero: contexto.documentoNumero ?? undefined
        });
        const porConsignacao = await Promise.all(
          consignacoes.map((c) => listarMovimentacoesComerciais(
            this._movimentacaoComercialRepository,
            ProjectionContext.create({ ...contexto.toJSON(), consignacaoId: c.id })
          ))
        );
        movimentacoesComerciais = porConsignacao.flat();
      } else {
        movimentacoesComerciais = await listarMovimentacoesComerciais(
          this._movimentacaoComercialRepository,
          contexto
        );
      }
    }

    if (contexto.perfilComercialId != null || contexto.clienteId != null) {
      movimentacoesPerfil = await listarMovimentacoesPerfil(
        this._movimentacaoPerfilRepository,
        contexto
      );
    }

    return { movimentacoesComerciais, movimentacoesPerfil };
  }

  async projetar({ movimentacoesComerciais, movimentacoesPerfil }, contexto) {
    const unificadas = [
      ...movimentacoesComerciais.map((m) => ({ ...m, ledger: 'CONSIGNACAO' })),
      ...movimentacoesPerfil.map((m) => ({ ...m, ledger: 'PERFIL' }))
    ];

    const ordenadas = ordenarCronologicamente(unificadas, contexto.ordenacao);
    const { itens, paginacao } = paginar(ordenadas, contexto.limite, contexto.offset);

    const dto = HistoricoDTO.create({
      filtros: contexto.toJSON(),
      movimentacoes: itens,
      total: ordenadas.length
    });

    return {
      dados: dto.toJSON(),
      paginacao,
      totais: {
        totalComercial: movimentacoesComerciais.length,
        totalPerfil: movimentacoesPerfil.length,
        total: ordenadas.length
      }
    };
  }
}

module.exports = HistoricoProjectionService;
