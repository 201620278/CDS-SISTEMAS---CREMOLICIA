/**
 * UC-004 — AlterarLimiteComercialUseCase
 *
 * @class AlterarLimiteComercialUseCase
 */

const PerfilWriteUseCase = require('./PerfilWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const {
  PerfilNaoEncontradoError,
  PerfilInvalidoError,
  LimiteComercialInsuficienteError
} = require('../../domain/errors');
const {
  gerarCorrelationId,
  criarSnapshotPerfil,
  registrarMovimentacaoPerfil,
  enfileirarEvento,
  exigirPermissaoUsuario,
  PERMISSAO_ALTERAR_LIMITE_COMERCIAL
} = require('./perfilUseCaseHelpers');
const { obterSaldoAbertoPerfilDerivado } = require('../../services/projections/ledgerCacheSync');

class AlterarLimiteComercialUseCase extends PerfilWriteUseCase {
  constructor(deps = {}) {
    super(deps);
    this._usuarioBridge = deps.usuarioBridge ?? null;
  }

  async validar(entrada) {
    if (!entrada?.perfilComercialId) {
      throw new PerfilInvalidoError('perfilComercialId é obrigatório');
    }
    if (entrada.novoLimite == null || Number(entrada.novoLimite) < 0) {
      throw new PerfilInvalidoError('novoLimite inválido', { novoLimite: entrada?.novoLimite });
    }
  }

  async autorizar(entrada) {
    await exigirPermissaoUsuario(
      this._usuarioBridge,
      entrada.usuarioId,
      PERMISSAO_ALTERAR_LIMITE_COMERCIAL
    );
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();
    const novoLimite = Number(entrada.novoLimite);

    return this.executarEscrita(async (uow, eventos) => {
      const perfil = await uow.perfilComercial.buscarPorId(entrada.perfilComercialId);
      if (!perfil) {
        throw new PerfilNaoEncontradoError(entrada.perfilComercialId);
      }

      const saldoAbertoDerivado = await obterSaldoAbertoPerfilDerivado(uow, perfil.id);
      if (novoLimite < saldoAbertoDerivado) {
        throw new LimiteComercialInsuficienteError({
          perfilComercialId: perfil.id,
          novoLimite,
          saldoAberto: saldoAbertoDerivado
        });
      }

      const limiteAnterior = perfil.limiteComercial;
      const atualizado = await uow.perfilComercial.atualizar(perfil.id, {
        limiteComercial: novoLimite
      });

      const snapshot = {
        ...criarSnapshotPerfil(atualizado, { operacao: 'LIMITE_ALTERADO' }),
        limiteAnterior,
        limiteComercial: novoLimite
      };

      await registrarMovimentacaoPerfil(uow, {
        perfilComercialId: atualizado.id,
        clienteId: atualizado.clienteId,
        tipoMovimentacao: 'LIMITE_ALTERADO',
        correlationId,
        snapshot,
        usuarioId: entrada.usuarioId ?? null,
        valor: novoLimite - limiteAnterior,
        motivo: entrada.motivo ?? 'Alteração de limite comercial'
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.LIMITE_COMERCIAL_ALTERADO, atualizado.id, {
        perfil: atualizado,
        limiteAnterior,
        limiteNovo: novoLimite,
        correlationId
      }, correlationId);

      return { perfil: atualizado, limiteAnterior, limiteNovo: novoLimite, correlationId };
    });
  }
}

module.exports = AlterarLimiteComercialUseCase;
