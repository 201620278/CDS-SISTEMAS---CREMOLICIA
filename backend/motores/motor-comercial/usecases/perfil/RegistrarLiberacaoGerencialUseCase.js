/**
 * UC-007 — RegistrarLiberacaoGerencialUseCase
 *
 * @class RegistrarLiberacaoGerencialUseCase
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

class RegistrarLiberacaoGerencialUseCase extends PerfilWriteUseCase {
  async validar(entrada) {
    if (!entrada?.perfilComercialId) {
      throw new PerfilInvalidoError('perfilComercialId é obrigatório');
    }
    if (!entrada?.motivo) {
      throw new PerfilInvalidoError('motivo é obrigatório para liberação gerencial');
    }
    if (!entrada?.usuarioId) {
      throw new PerfilInvalidoError('usuarioId responsável é obrigatório');
    }
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();

    return this.executarEscrita(async (uow, eventos) => {
      const perfil = await uow.perfilComercial.buscarPorId(entrada.perfilComercialId);
      if (!perfil) {
        throw new PerfilNaoEncontradoError(entrada.perfilComercialId);
      }

      const snapshot = {
        ...criarSnapshotPerfil(perfil, { operacao: 'LIBERACAO_GERENCIAL' }),
        valorLiberado: entrada.valor ?? null,
        motivo: entrada.motivo,
        usuarioResponsavelId: entrada.usuarioId
      };

      const movimentacao = await registrarMovimentacaoPerfil(uow, {
        perfilComercialId: perfil.id,
        clienteId: perfil.clienteId,
        tipoMovimentacao: 'LIBERACAO_GERENCIAL',
        correlationId,
        snapshot,
        usuarioId: entrada.usuarioId,
        valor: entrada.valor ?? null,
        motivo: entrada.motivo,
        detalhes: entrada.detalhes ?? null
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.LIBERACAO_GERENCIAL_REGISTRADA, perfil.id, {
        perfil,
        movimentacao,
        motivo: entrada.motivo,
        correlationId
      }, correlationId);

      return { perfil, movimentacao, correlationId };
    });
  }
}

module.exports = RegistrarLiberacaoGerencialUseCase;
