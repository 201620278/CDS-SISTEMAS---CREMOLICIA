/**
 * UC-006 — DesbloquearPerfilComercialUseCase
 *
 * @class DesbloquearPerfilComercialUseCase
 */

const PerfilWriteUseCase = require('./PerfilWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const {
  PerfilNaoEncontradoError,
  PerfilInvalidoError
} = require('../../domain/errors');
const {
  gerarCorrelationId,
  criarSnapshotPerfil,
  registrarMovimentacaoPerfil,
  enfileirarEvento
} = require('./perfilUseCaseHelpers');

class DesbloquearPerfilComercialUseCase extends PerfilWriteUseCase {
  async validar(entrada) {
    if (!entrada?.perfilComercialId) {
      throw new PerfilInvalidoError('perfilComercialId é obrigatório');
    }
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();

    return this.executarEscrita(async (uow, eventos) => {
      const perfil = await uow.perfilComercial.buscarPorId(entrada.perfilComercialId);
      if (!perfil) {
        throw new PerfilNaoEncontradoError(entrada.perfilComercialId);
      }
      if (!perfil.bloqueado) {
        throw new PerfilInvalidoError('Perfil não está bloqueado', { perfilComercialId: perfil.id });
      }

      const atualizado = await uow.perfilComercial.atualizar(perfil.id, {
        bloqueado: false,
        motivoBloqueio: null
      });

      const snapshot = criarSnapshotPerfil(atualizado, { operacao: 'BLOQUEIO_REMOVIDO' });
      await registrarMovimentacaoPerfil(uow, {
        perfilComercialId: atualizado.id,
        clienteId: atualizado.clienteId,
        tipoMovimentacao: 'BLOQUEIO_REMOVIDO',
        correlationId,
        snapshot,
        usuarioId: entrada.usuarioId ?? null,
        motivo: entrada.motivo ?? 'Remoção de bloqueio comercial'
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.PERFIL_DESBLOQUEADO, atualizado.id, {
        perfil: atualizado,
        correlationId
      }, correlationId);

      return { perfil: atualizado, correlationId };
    });
  }
}

module.exports = DesbloquearPerfilComercialUseCase;
