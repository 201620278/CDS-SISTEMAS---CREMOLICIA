/**
 * UC-001 — CriarPerfilComercialUseCase
 *
 * @class CriarPerfilComercialUseCase
 */

const PerfilWriteUseCase = require('./PerfilWriteUseCase');
const { PERFIL_TIPOS } = require('../../config/comercialConstants');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const {
  ClienteNaoEncontradoError,
  PerfilDuplicadoError,
  PerfilInvalidoError
} = require('../../domain/errors');
const {
  gerarCorrelationId,
  criarSnapshotPerfil,
  registrarMovimentacaoPerfil,
  enfileirarEvento
} = require('./perfilUseCaseHelpers');

class CriarPerfilComercialUseCase extends PerfilWriteUseCase {
  constructor(deps = {}) {
    super(deps);
    this._clienteBridge = deps.clienteBridge ?? null;
  }

  async validar(entrada) {
    if (!entrada?.clienteId) {
      throw new PerfilInvalidoError('clienteId é obrigatório');
    }
    if (!entrada?.perfilTipo || !PERFIL_TIPOS.includes(entrada.perfilTipo)) {
      throw new PerfilInvalidoError('perfilTipo inválido', { perfilTipo: entrada?.perfilTipo });
    }
    if (!this._clienteBridge) {
      throw new PerfilInvalidoError('IClienteBridge não configurado');
    }
  }

  async processar(entrada) {
    const cliente = await this._clienteBridge.buscarPorId(entrada.clienteId);
    if (!cliente) {
      throw new ClienteNaoEncontradoError(entrada.clienteId);
    }

    const ativo = await this._clienteBridge.estaAtivo(entrada.clienteId);
    if (!ativo) {
      throw new PerfilInvalidoError('Cliente inativo', { clienteId: entrada.clienteId });
    }

    const correlationId = entrada.correlationId ?? gerarCorrelationId();

    return this.executarEscrita(async (uow, eventos) => {
      const existentes = await uow.perfilComercial.listar({
        clienteId: entrada.clienteId,
        perfilTipo: entrada.perfilTipo
      });
      if (existentes.length > 0) {
        throw new PerfilDuplicadoError(entrada.clienteId, entrada.perfilTipo);
      }

      const perfil = await uow.perfilComercial.inserir({
        clienteId: entrada.clienteId,
        perfilTipo: entrada.perfilTipo,
        ativo: entrada.ativo !== false,
        limiteComercial: entrada.limiteComercial ?? 0,
        saldoAberto: 0,
        bloqueado: false,
        observacoes: entrada.observacoes ?? null,
        dataAtivacao: entrada.ativo !== false ? new Date().toISOString() : null
      });

      const snapshot = criarSnapshotPerfil(perfil, { operacao: 'PERFIL_CRIADO' });
      await registrarMovimentacaoPerfil(uow, {
        perfilComercialId: perfil.id,
        clienteId: perfil.clienteId,
        tipoMovimentacao: 'PERFIL_CRIADO',
        correlationId,
        snapshot,
        usuarioId: entrada.usuarioId ?? null,
        motivo: entrada.motivo ?? 'Criação de perfil comercial'
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.PERFIL_COMERCIAL_CRIADO, perfil.id, {
        perfil,
        correlationId
      }, correlationId);

      return { perfil, correlationId };
    });
  }
}

module.exports = CriarPerfilComercialUseCase;
