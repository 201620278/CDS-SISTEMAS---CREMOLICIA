/**
 * centralEventosEmitter — Emissão de eventos sem acoplamento circular.
 *
 * @module motores/central-entradas/utils/centralEventosEmitter
 */

const { TIPOS_EVENTO } = require('../config/centralEventosTipos');

/** @type {import('../services/CentralEventosService')|null} */
let eventosService = null;
/** @type {import('../services/CentralNotificacoesService')|null} */
let notificacoesService = null;

function obterEventosService() {
  if (!eventosService) {
    const CentralEventosService = require('../services/CentralEventosService');
    eventosService = new CentralEventosService();
  }
  return eventosService;
}

function obterNotificacoesService() {
  if (!notificacoesService) {
    const CentralNotificacoesService = require('../services/CentralNotificacoesService');
    notificacoesService = new CentralNotificacoesService();
  }
  return notificacoesService;
}

/**
 * @param {Object} dados
 * @returns {Promise<Object|null>}
 */
async function emitirEvento(dados) {
  try {
    return await obterEventosService().registrar(dados);
  } catch (error) {
    console.warn('[Central Eventos]', error.message);
    return null;
  }
}

/**
 * @param {Object} dados
 * @returns {Promise<void>}
 */
async function emitirDocumentoRecebido(documento, origem = 'sistema') {
  if (!documento?.id) return;
  await emitirEvento({
    tipo: TIPOS_EVENTO.DOCUMENTO_RECEBIDO,
    origem,
    descricao: `Documento recebido: NF ${documento.numero || documento.chave?.slice(-8) || documento.id}`,
    resultado: documento.status,
    sucesso: true,
    documentoId: documento.id,
    detalhe: {
      chave: documento.chave,
      fornecedor: documento.fornecedor,
      valorTotal: documento.valorTotal
    }
  });
}

/**
 * @param {Object} documento
 * @param {Object} [opcoes]
 * @returns {Promise<void>}
 */
async function emitirDocumentoProcessado(documento, opcoes = {}) {
  if (!documento?.id) return;
  await emitirEvento({
    tipo: TIPOS_EVENTO.DOCUMENTO_PROCESSADO,
    origem: opcoes.origem || 'api',
    descricao: opcoes.mensagem || `Documento processado #${documento.id}`,
    resultado: documento.status,
    sucesso: opcoes.sucesso !== false,
    documentoId: documento.id
  });

  if (documento.status === 'PRONTA_PARA_COMPRA') {
    try {
      await obterNotificacoesService().criar({
        tipo: 'PRONTA_COMPRA',
        titulo: 'Documento pronto para lançamento',
        mensagem: `NF ${documento.numero || documento.id} está pronta para Compras.`,
        documentoId: documento.id
      });
    } catch { /* ignore */ }
  }
}

/**
 * @param {Object} documento
 * @param {number|string} compraId
 * @returns {Promise<void>}
 */
async function emitirCompraGravada(documento, compraId) {
  if (!documento?.id) return;
  await emitirEvento({
    tipo: TIPOS_EVENTO.COMPRA_GRAVADA,
    origem: 'sistema',
    descricao: `Compra #${compraId} gravada para documento #${documento.id}`,
    resultado: 'GRAVADA',
    sucesso: true,
    documentoId: documento.id,
    detalhe: { compraId }
  });

  try {
    await obterNotificacoesService().criar({
      tipo: 'COMPRA_GRAVADA',
      titulo: 'Compra gravada na Central',
      mensagem: `Compra #${compraId} vinculada ao documento #${documento.id}.`,
      documentoId: documento.id
    });
  } catch { /* ignore */ }
}

/**
 * @param {string} mensagem
 * @param {Object} [opcoes]
 * @returns {Promise<void>}
 */
async function emitirErro(mensagem, opcoes = {}) {
  await emitirEvento({
    tipo: TIPOS_EVENTO.ERRO,
    origem: opcoes.origem || 'sistema',
    descricao: mensagem,
    resultado: 'erro',
    sucesso: false,
    documentoId: opcoes.documentoId || null,
    detalhe: opcoes.detalhe || null
  });
}

module.exports = {
  emitirEvento,
  emitirDocumentoRecebido,
  emitirDocumentoProcessado,
  emitirCompraGravada,
  emitirErro,
  TIPOS_EVENTO
};
