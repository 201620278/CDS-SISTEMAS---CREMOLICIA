/**
 * UC-005 — BloquearPerfilComercialUseCase
 *
 * @class BloquearPerfilComercialUseCase
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

class BloquearPerfilComercialUseCase extends PerfilWriteUseCase {
  async validar(entrada) {
    if (!entrada?.perfilComercialId) {
      throw new PerfilInvalidoError('perfilComercialId é obrigatório');
    }
    if (!entrada?.motivo) {
      throw new PerfilInvalidoError('motivo do bloqueio é obrigatório');
    }
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();

    return this.executarEscrita(async (uow, eventos) => {
      const perfil = await uow.perfilComercial.buscarPorId(entrada.perfilComercialId);
      if (!perfil) {
        throw new PerfilNaoEncontradoError(entrada.perfilComercialId);
      }
      if (perfil.bloqueado) {
        throw new PerfilInvalidoError('Perfil já está bloqueado', { perfilComercialId: perfil.id });
      }

      const atualizado = await uow.perfilComercial.atualizar(perfil.id, {
        bloqueado: true,
        motivoBloqueio: entrada.motivo
      });

      const snapshot = criarSnapshotPerfil(atualizado, { operacao: 'BLOQUEIO_APLICADO' });
      await registrarMovimentacaoPerfil(uow, {
        perfilComercialId: atualizado.id,
        clienteId: atualizado.clienteId,
        tipoMovimentacao: 'BLOQUEIO_APLICADO',
        correlationId,
        snapshot,
        usuarioId: entrada.usuarioId ?? null,
        motivo: entrada.motivo
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.PERFIL_BLOQUEADO, atualizado.id, {
        perfil: atualizado,
        motivo: entrada.motivo,
        correlationId
      }, correlationId);

      return { perfil: atualizado, correlationId };
    });
  }
}

module.exports = BloquearPerfilComercialUseCase;
