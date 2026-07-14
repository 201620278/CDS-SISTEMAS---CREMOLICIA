/**
 * UC-004 — AtualizarPerfilComercialUseCase
 *
 * Sprint S-4: persiste observações e delega mudança de status a ativar/inativar.
 *
 * @class AtualizarPerfilComercialUseCase
 */

const PerfilWriteUseCase = require('./PerfilWriteUseCase');
const {
  PerfilNaoEncontradoError,
  PerfilInvalidoError
} = require('../../domain/errors');
const {
  gerarCorrelationId
} = require('./perfilUseCaseHelpers');

class AtualizarPerfilComercialUseCase extends PerfilWriteUseCase {
  /**
   * @param {Object} deps
   * @param {import('./AtivarPerfilComercialUseCase')} deps.ativarPerfilComercialUseCase
   * @param {import('./InativarPerfilComercialUseCase')} deps.inativarPerfilComercialUseCase
   */
  constructor(deps = {}) {
    super(deps);
    this._perfilRepository = deps.perfilComercialRepository ?? null;
    this._ativar = deps.ativarPerfilComercialUseCase;
    this._inativar = deps.inativarPerfilComercialUseCase;
  }

  async validar(entrada) {
    if (!entrada?.perfilComercialId) {
      throw new PerfilInvalidoError('perfilComercialId é obrigatório');
    }
  }

  _obterRepositorioPerfil() {
    return this._perfilRepository ?? this.obterUnitOfWork()?.perfilComercial ?? null;
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();
    const repo = this._obterRepositorioPerfil();
    if (!repo) {
      throw new PerfilInvalidoError('Repositório de perfil comercial não configurado');
    }

    let perfil = await repo.buscarPorId(entrada.perfilComercialId);
    if (!perfil) {
      throw new PerfilNaoEncontradoError(entrada.perfilComercialId);
    }

    if (entrada.ativo === false && perfil.ativo) {
      const resultado = await this._inativar.executar({
        ...entrada,
        correlationId
      });
      perfil = resultado.perfil;
    } else if (entrada.ativo === true && !perfil.ativo) {
      const resultado = await this._ativar.executar({
        ...entrada,
        correlationId
      });
      perfil = resultado.perfil;
    }

    if (entrada.observacoes !== undefined && entrada.observacoes !== perfil.observacoes) {
      return this.executarEscrita(async (uow) => {
        const atualizado = await uow.perfilComercial.atualizar(perfil.id, {
          observacoes: entrada.observacoes
        });
        return { perfil: atualizado, correlationId };
      });
    }

    return { perfil, correlationId };
  }
}

module.exports = AtualizarPerfilComercialUseCase;
