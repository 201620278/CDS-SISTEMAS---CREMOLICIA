/**
 * UC-011 — ConsultarScoreConfiabilidadeUseCase
 *
 * @class ConsultarScoreConfiabilidadeUseCase
 */

const PerfilReadUseCase = require('./PerfilReadUseCase');
const { PerfilInvalidoError } = require('../../domain/errors');

class ConsultarScoreConfiabilidadeUseCase extends PerfilReadUseCase {
  constructor(deps = {}) {
    super(deps);
    this._scoreService = deps.scoreService ?? null;
  }

  async validar(entrada) {
    if (!entrada?.perfilComercialId) {
      throw new PerfilInvalidoError('perfilComercialId é obrigatório');
    }
  }

  async processar(entrada) {
    const perfil = await this._obterPerfilOuFalhar(entrada.perfilComercialId);

    if (this._scoreService?.obterScore) {
      const score = await this._scoreService.obterScore(perfil.id);
      return {
        perfilComercialId: perfil.id,
        score: score?.valor ?? score?.score ?? score,
        calculadoEm: score?.calculadoEm ?? null,
        fonte: 'ScoreService'
      };
    }

    return {
      perfilComercialId: perfil.id,
      score: perfil.scoreConfiabilidade,
      calculadoEm: perfil.scoreCalculadoEm,
      fonte: 'cache'
    };
  }
}

module.exports = ConsultarScoreConfiabilidadeUseCase;
