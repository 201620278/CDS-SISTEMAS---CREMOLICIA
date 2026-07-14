/**
 * Autorização Gerencial — serviço de registro (STAB-01.3)
 *
 * Valida token de supervisor (auth oficial) e grava auditoria.
 * NÃO altera limite comercial do cliente.
 *
 * @module motores/motor-comercial/services/autorizacaoGerencialService
 */

const { verificarSupervisorToken } = require('../../../rotas/auth');
const { gravarAuditoria, contextoAuditoriaRequisicao } = require('../../../services/auditoria');

const TIPO = 'AUTORIZACAO_GERENCIAL';
const EVENTO_LIMITE = 'Entrega acima do limite comercial';

/**
 * @param {Object} payload
 * @param {string} payload.supervisorToken
 * @param {Object} payload.dados
 * @param {import('express').Request} [req]
 */
async function registrarAutorizacaoGerencialLimite(payload = {}, req = null) {
  const token = payload.supervisorToken || payload.supervisor_token;
  if (!token) {
    const err = new Error('Token de autorização gerencial é obrigatório');
    err.status = 400;
    throw err;
  }

  let supervisor;
  try {
    supervisor = await verificarSupervisorToken(token);
  } catch (error) {
    const err = new Error(error.message || 'Autorização gerencial inválida');
    err.status = 401;
    throw err;
  }

  const dados = payload.dados || {};
  const agora = new Date();
  const ctx = contextoAuditoriaRequisicao(req);

  const detalhes = {
    tipo: TIPO,
    evento: EVENTO_LIMITE,
    clienteId: dados.clienteId ?? null,
    clienteNome: dados.clienteNome ?? null,
    consignacaoId: dados.consignacaoId ?? null,
    valorEntrega: Number(dados.valorEntrega ?? 0),
    creditoDisponivel: Number(dados.creditoDisponivel ?? 0),
    valorExcedido: Number(dados.valorExcedido ?? 0),
    motivo: dados.motivo || null,
    autorizadoPor: {
      id: supervisor.id || supervisor.usuario_id,
      username: supervisor.username,
      nome: supervisor.nome || supervisor.username,
      perfil: supervisor.perfil || supervisor.role
    },
    data: agora.toISOString().slice(0, 10),
    hora: agora.toTimeString().slice(0, 8),
    autorizadoEm: agora.toISOString(),
    operadorSolicitante: {
      id: ctx.usuario_id,
      nome: ctx.usuario_nome
    }
  };

  const registro = await gravarAuditoria({
    usuario_id: supervisor.id || supervisor.usuario_id || ctx.usuario_id,
    usuario_nome: supervisor.username || supervisor.nome || ctx.usuario_nome,
    modulo: 'motor-comercial',
    acao: TIPO,
    referencia_tipo: dados.consignacaoId ? 'consignacao' : 'cliente',
    referencia_id: dados.consignacaoId || dados.clienteId || null,
    detalhes,
    ip_requisicao: ctx.ip_requisicao
  });

  return {
    autorizado: true,
    auditoriaId: registro.id,
    tipo: TIPO,
    evento: EVENTO_LIMITE,
    supervisorToken: token,
    autorizadoPor: detalhes.autorizadoPor,
    motivo: detalhes.motivo,
    valorEntrega: detalhes.valorEntrega,
    creditoDisponivel: detalhes.creditoDisponivel,
    valorExcedido: detalhes.valorExcedido,
    clienteId: detalhes.clienteId,
    consignacaoId: detalhes.consignacaoId,
    autorizadoEm: detalhes.autorizadoEm,
    expiresAt: new Date(agora.getTime() + 15 * 60 * 1000).toISOString()
  };
}

/**
 * Confirma se o payload de liberação da operação atual ainda é válido.
 * @param {Object|null} liberacao
 * @returns {boolean}
 */
function liberacaoGerencialValida(liberacao) {
  if (!liberacao || liberacao.autorizado !== true) return false;
  if (!liberacao.supervisorToken && !liberacao.auditoriaId) return false;
  if (liberacao.expiresAt) {
    const exp = new Date(liberacao.expiresAt).getTime();
    if (Number.isFinite(exp) && Date.now() > exp) return false;
  }
  return true;
}

module.exports = {
  TIPO,
  EVENTO_LIMITE,
  registrarAutorizacaoGerencialLimite,
  liberacaoGerencialValida
};
