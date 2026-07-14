/**
 * Helpers compartilhados dos Use Cases de PerfilComercial.
 *
 * @module motores/motor-comercial/usecases/perfil/perfilUseCaseHelpers
 */

const DomainEvent = require('../../domain/events/DomainEvent');
const { TIPOS_LEDGER_PERFIL } = require('../../config/comercialTiposMovimentacao');
const { OperacaoNaoAutorizadaError, PerfilInvalidoError } = require('../../domain/errors');

const PERMISSAO_ALTERAR_LIMITE_COMERCIAL = 'COMERCIAL_LIMITE';

function gerarCorrelationId() {
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * @param {Object} perfil
 * @param {Object} [contexto]
 * @returns {Object}
 */
function criarSnapshotPerfil(perfil, contexto = {}) {
  return {
    contexto,
    perfilComercialId: perfil.id,
    clienteId: perfil.clienteId,
    perfilTipo: perfil.perfilTipo,
    limiteComercial: perfil.limiteComercial,
    saldoAberto: perfil.saldoAberto,
    ativo: perfil.ativo,
    bloqueado: perfil.bloqueado,
    capturadoEm: new Date().toISOString()
  };
}

/**
 * @param {import('../../infrastructure/transactions/UnitOfWork')} uow
 * @param {Object} dados
 * @returns {Promise<Object>}
 */
async function registrarMovimentacaoPerfil(uow, dados) {
  const tipo = TIPOS_LEDGER_PERFIL[dados.tipoMovimentacao];
  if (!tipo) {
    const { MovimentacaoInvalidaError } = require('../../domain/errors');
    throw new MovimentacaoInvalidaError(`Tipo de movimentação inválido: ${dados.tipoMovimentacao}`);
  }

  if (tipo.exigeSnapshot && !dados.snapshot) {
    const { MovimentacaoInvalidaError } = require('../../domain/errors');
    throw new MovimentacaoInvalidaError('Snapshot obrigatório para este tipo de movimentação');
  }

  return uow.movimentacaoPerfil.inserir({
    perfilComercialId: dados.perfilComercialId,
    clienteId: dados.clienteId,
    tipoMovimentacao: dados.tipoMovimentacao,
    origem: dados.origem ?? 'SISTEMA',
    correlationId: dados.correlationId,
    causationId: dados.causationId ?? null,
    snapshot: dados.snapshot ?? null,
    usuarioId: dados.usuarioId ?? null,
    dataMovimentacao: dados.dataMovimentacao ?? new Date().toISOString(),
    valor: dados.valor ?? null,
    motivo: dados.motivo ?? null,
    detalhes: dados.detalhes ?? null,
    referenciaExterna: dados.referenciaExterna ?? null
  });
}

/**
 * @param {import('../../domain/events/DomainEvent')[]} eventos
 * @param {string} tipo
 * @param {number|string} aggregateId
 * @param {Object} payload
 * @param {string} [correlationId]
 */
function enfileirarEvento(eventos, tipo, aggregateId, payload, correlationId = null) {
  eventos.push(new DomainEvent({
    tipo,
    aggregateId,
    aggregateTipo: 'PerfilComercial',
    payload,
    correlationId
  }));
}

/**
 * Reconstrói limite e saldo a partir do ledger + perfil.
 *
 * @param {Object} perfil
 * @param {Object[]} movimentacoesPerfil
 * @param {number|null} [saldoAbertoComercial] Saldo derivado do ledger comercial
 * @returns {{ limiteComercial: number, saldoAberto: number, limiteDisponivel: number }}
 */
function calcularLimiteDisponivel(perfil, movimentacoesPerfil, saldoAbertoComercial = null) {
  let limiteComercial = Number(perfil.limiteComercial ?? 0);
  let saldoAberto = saldoAbertoComercial != null
    ? Number(saldoAbertoComercial)
    : Number(perfil.saldoAberto ?? 0);

  const ordenadas = [...movimentacoesPerfil].sort((a, b) => {
    const da = new Date(a.dataMovimentacao).getTime();
    const db = new Date(b.dataMovimentacao).getTime();
    return da - db || (a.id ?? 0) - (b.id ?? 0);
  });

  for (const mov of ordenadas) {
    if (mov.tipoMovimentacao === 'LIMITE_ALTERADO' && mov.snapshot?.limiteComercial != null) {
      limiteComercial = Number(mov.snapshot.limiteComercial);
    }
    if (mov.tipoMovimentacao === 'LIBERACAO_GERENCIAL' && mov.valor != null) {
      limiteComercial += Number(mov.valor);
    }
    if (saldoAbertoComercial == null) {
      if (mov.snapshot?.saldoAberto != null) {
        saldoAberto = Number(mov.snapshot.saldoAberto);
      } else if (mov.valor != null && mov.tipoMovimentacao !== 'LIMITE_ALTERADO') {
        saldoAberto += Number(mov.valor);
      }
    }
  }

  return {
    limiteComercial,
    saldoAberto,
    limiteDisponivel: limiteComercial - saldoAberto
  };
}

/**
 * @param {import('../../domain/contracts/bridges/IUsuarioBridge')|null} usuarioBridge
 * @param {string|number|null} usuarioId
 * @param {string} permissao
 */
async function exigirPermissaoUsuario(usuarioBridge, usuarioId, permissao) {
  if (!usuarioBridge) {
    throw new PerfilInvalidoError('UsuarioBridge não configurado');
  }
  if (usuarioId == null || usuarioId === '') {
    throw new PerfilInvalidoError('usuarioId é obrigatório para esta operação');
  }

  const permitido = await usuarioBridge.possuiPermissao(usuarioId, permissao);
  if (!permitido) {
    throw new OperacaoNaoAutorizadaError(
      permissao,
      'Usuário sem permissão para alterar limite comercial'
    );
  }
}

module.exports = {
  PERMISSAO_ALTERAR_LIMITE_COMERCIAL,
  gerarCorrelationId,
  criarSnapshotPerfil,
  registrarMovimentacaoPerfil,
  enfileirarEvento,
  calcularLimiteDisponivel,
  exigirPermissaoUsuario
};
