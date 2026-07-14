/**
 * Badges operacionais — Central de Operações Comerciais.
 *
 * Sprint O-3.
 *
 * @module frontend/modules/motor-comercial/pages/Consignacoes/badges
 */

const Badge = require('../../components/base/Badge');

const STATUS_BADGES = {
  RASCUNHO: { variant: 'default', text: 'Rascunho' },
  ENTREGUE: { variant: 'info', text: 'Entregue' },
  'PRESTACAO_ABERTA': { variant: 'warning', text: 'Fechamento em Aberto' },
  ACERTADA: { variant: 'success', text: 'Acertada' },
  ENCERRADA: { variant: 'primary', text: 'Encerrada' },
  QUITADA: { variant: 'success', text: 'Quitada' },
  CANCELADA: { variant: 'error', text: 'Cancelada' },
  ATRASADA: { variant: 'error', text: 'Atrasada' },
  URGENTE: { variant: 'error', text: 'Urgente' }
};

function resolveOperationalStatus(consignacao) {
  if (!consignacao) return 'RASCUNHO';
  if (consignacao.operationalStatus) return consignacao.operationalStatus;
  if (consignacao.status === 'ENTREGUE') {
    if (consignacao.prestacaoAberta) return 'PRESTACAO_ABERTA';
    if (consignacao.prestacaoAtrasada) return 'ATRASADA';
    if (consignacao.urgente) return 'URGENTE';
  }
  return consignacao.status || 'RASCUNHO';
}

function createOperationalBadge(consignacao) {
  const status = resolveOperationalStatus(consignacao);
  const config = STATUS_BADGES[status] || { variant: 'default', text: status };
  return Badge.create({ text: config.text, variant: config.variant });
}

function enrichConsignacaoOperationalFlags(item, resumoMap = {}) {
  const resumo = resumoMap[item.id] || {};
  const saldo = Number(resumo.saldoAtual ?? resumo.saldo ?? 0);
  const entrega = item.dataEntrega ? new Date(item.dataEntrega) : null;
  const diasDesdeEntrega = entrega
    ? Math.floor((Date.now() - entrega.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const prestacaoAberta = item.status === 'ENTREGUE' && saldo > 0;
  const prestacaoAtrasada = prestacaoAberta && diasDesdeEntrega > 30;
  const urgente = prestacaoAberta && diasDesdeEntrega > 45;

  return {
    ...item,
    prestacaoAberta,
    prestacaoAtrasada,
    urgente,
    saldo,
    valor: Number(resumo.valorConsignado ?? resumo.valorVendido ?? 0),
    prestacaoStatus: prestacaoAberta ? 'ABERTA' : (item.status === 'ACERTADA' ? 'FECHADA' : '-'),
    operationalStatus: resolveOperationalStatus({
      ...item,
      prestacaoAberta,
      prestacaoAtrasada,
      urgente
    })
  };
}

module.exports = {
  STATUS_BADGES,
  resolveOperationalStatus,
  createOperationalBadge,
  enrichConsignacaoOperationalFlags
};
