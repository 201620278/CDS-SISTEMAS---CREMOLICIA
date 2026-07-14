/**
 * UC-009 — ConsultarHistoricoPerfilUseCase
 *
 * @class ConsultarHistoricoPerfilUseCase
 */

const PerfilReadUseCase = require('./PerfilReadUseCase');
const { PerfilInvalidoError } = require('../../domain/errors');

class ConsultarHistoricoPerfilUseCase extends PerfilReadUseCase {
  async validar(entrada) {
    if (!entrada?.perfilComercialId) {
      throw new PerfilInvalidoError('perfilComercialId é obrigatório');
    }
  }

  async processar(entrada) {
    await this._obterPerfilOuFalhar(entrada.perfilComercialId);

    const movimentacoes = await this._movimentacaoPerfilRepository.listar({
      perfilComercialId: entrada.perfilComercialId,
      tipoMovimentacao: entrada.tipoMovimentacao,
      dataInicio: entrada.dataInicio,
      dataFim: entrada.dataFim,
      limite: entrada.limite,
      offset: entrada.offset
    });

    return {
      perfilComercialId: entrada.perfilComercialId,
      movimentacoes,
      total: movimentacoes.length
    };
  }
}

module.exports = ConsultarHistoricoPerfilUseCase;
