/**
 * Helpers compartilhados dos Use Cases de Consignacao.
 *
 * @module motores/motor-comercial/usecases/consignacao/consignacaoUseCaseHelpers
 */

const DomainEvent = require('../../domain/events/DomainEvent');
const {
  ConsignacaoNaoEncontradaError,
  ConsignacaoNaoEstaEmRascunhoError,
  DocumentoDuplicadoError
} = require('../../domain/errors');

const STATUS_RASCUNHO = 'RASCUNHO';
const STATUS_ENTREGUE = 'ENTREGUE';
const STATUS_CANCELADA = 'CANCELADA';

function gerarCorrelationId() {
  return `corr-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
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
    aggregateTipo: 'Consignacao',
    payload,
    correlationId
  }));
}

/**
 * @param {Object|null} consignacao
 * @returns {Object}
 */
function obterConsignacaoEmRascunho(consignacao) {
  if (!consignacao) {
    throw new ConsignacaoNaoEncontradaError();
  }
  if (consignacao.status !== STATUS_RASCUNHO) {
    throw new ConsignacaoNaoEstaEmRascunhoError(consignacao.id, consignacao.status);
  }
  return consignacao;
}

/**
 * @param {import('../../domain/contracts/repositories/IConsignacaoRepository')} repo
 * @param {Object} documento
 * @param {number|string} [ignorarConsignacaoId]
 * @returns {Promise<void>}
 */
async function validarDocumentoUnico(repo, documento, ignorarConsignacaoId = null) {
  if (!documento?.serie || documento.sequencial == null) return;

  const candidatos = await repo.listar({
    documentoNumero: documento.numero ?? undefined
  });

  const duplicado = candidatos.find((c) => {
    if (c.id === ignorarConsignacaoId) return false;
    if (c.status === STATUS_CANCELADA) return false;
    return c.documento?.serie === documento.serie
      && Number(c.documento?.sequencial) === Number(documento.sequencial);
  });

  if (duplicado) {
    throw new DocumentoDuplicadoError(documento);
  }
}

/**
 * @param {Object} perfil
 * @param {number|string} clienteId
 */
function validarPerfilConsignado(perfil, clienteId) {
  const { ClienteNaoHabilitadoParaConsignacaoError } = require('../../domain/errors');

  if (!perfil) {
    throw new ClienteNaoHabilitadoParaConsignacaoError({ motivo: 'Perfil comercial não encontrado' });
  }
  if (Number(perfil.clienteId) !== Number(clienteId)) {
    throw new ClienteNaoHabilitadoParaConsignacaoError({
      motivo: 'Perfil não pertence ao cliente',
      clienteId,
      perfilClienteId: perfil.clienteId
    });
  }
  if (perfil.perfilTipo !== 'CONSIGNADO') {
    throw new ClienteNaoHabilitadoParaConsignacaoError({
      motivo: 'Perfil não é do tipo CONSIGNADO',
      perfilTipo: perfil.perfilTipo
    });
  }
  if (!perfil.ativo) {
    throw new ClienteNaoHabilitadoParaConsignacaoError({ motivo: 'Perfil inativo', perfilId: perfil.id });
  }
  if (perfil.bloqueado) {
    throw new ClienteNaoHabilitadoParaConsignacaoError({ motivo: 'Perfil bloqueado', perfilId: perfil.id });
  }
}

module.exports = {
  STATUS_RASCUNHO,
  STATUS_ENTREGUE,
  STATUS_CANCELADA,
  gerarCorrelationId,
  enfileirarEvento,
  obterConsignacaoEmRascunho,
  validarDocumentoUnico,
  validarPerfilConsignado
};
