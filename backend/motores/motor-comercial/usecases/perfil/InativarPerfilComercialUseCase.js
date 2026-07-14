/**
 * UC-003 — InativarPerfilComercialUseCase
 *
 * @class InativarPerfilComercialUseCase
 */

const PerfilWriteUseCase = require('./PerfilWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const {
  PerfilNaoEncontradoError,
  PerfilJaInativoError,
  PerfilInvalidoError
} = require('../../domain/errors');
const {
  gerarCorrelationId,
  criarSnapshotPerfil,
  registrarMovimentacaoPerfil,
  enfileirarEvento
} = require('./perfilUseCaseHelpers');

class InativarPerfilComercialUseCase extends PerfilWriteUseCase {
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
      if (!perfil.ativo) {
        throw new PerfilJaInativoError(perfil.id);
      }

      const atualizado = await uow.perfilComercial.atualizar(perfil.id, {
        ativo: false,
        dataInativacao: new Date().toISOString()
      });

      const snapshot = criarSnapshotPerfil(atualizado, { operacao: 'PERFIL_INATIVADO' });
      await registrarMovimentacaoPerfil(uow, {
        perfilComercialId: atualizado.id,
        clienteId: atualizado.clienteId,
        tipoMovimentacao: 'PERFIL_INATIVADO',
        correlationId,
        snapshot,
        usuarioId: entrada.usuarioId ?? null,
        motivo: entrada.motivo ?? 'Inativação de perfil comercial'
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.PERFIL_COMERCIAL_INATIVADO, atualizado.id, {
        perfil: atualizado,
        correlationId
      }, correlationId);

      return { perfil: atualizado, correlationId };
    });
  }
}

module.exports = InativarPerfilComercialUseCase;
