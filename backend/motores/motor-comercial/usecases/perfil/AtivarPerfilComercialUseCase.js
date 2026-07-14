/**
 * UC-002 — AtivarPerfilComercialUseCase
 *
 * @class AtivarPerfilComercialUseCase
 */

const PerfilWriteUseCase = require('./PerfilWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const {
  PerfilNaoEncontradoError,
  PerfilJaAtivoError,
  PerfilInvalidoError
} = require('../../domain/errors');
const {
  gerarCorrelationId,
  criarSnapshotPerfil,
  registrarMovimentacaoPerfil,
  enfileirarEvento
} = require('./perfilUseCaseHelpers');

class AtivarPerfilComercialUseCase extends PerfilWriteUseCase {
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
      if (perfil.ativo) {
        throw new PerfilJaAtivoError(perfil.id);
      }

      const atualizado = await uow.perfilComercial.atualizar(perfil.id, {
        ativo: true,
        dataAtivacao: new Date().toISOString(),
        dataInativacao: null
      });

      const snapshot = criarSnapshotPerfil(atualizado, { operacao: 'PERFIL_ATIVADO' });
      await registrarMovimentacaoPerfil(uow, {
        perfilComercialId: atualizado.id,
        clienteId: atualizado.clienteId,
        tipoMovimentacao: 'PERFIL_ATIVADO',
        correlationId,
        snapshot,
        usuarioId: entrada.usuarioId ?? null,
        motivo: entrada.motivo ?? 'Ativação de perfil comercial'
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.PERFIL_COMERCIAL_ATIVADO, atualizado.id, {
        perfil: atualizado,
        correlationId
      }, correlationId);

      return { perfil: atualizado, correlationId };
    });
  }
}

module.exports = AtivarPerfilComercialUseCase;
