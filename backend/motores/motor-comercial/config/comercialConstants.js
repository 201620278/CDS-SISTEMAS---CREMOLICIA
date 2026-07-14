/**
 * Constantes de persistência do Motor Comercial — Sprint 2.2
 *
 * @module motores/motor-comercial/config/comercialConstants
 */

const TABELAS = Object.freeze({
  PERFIL_COMERCIAL: 'perfil_comercial',
  CONSIGNACOES: 'consignacoes',
  CONSIGNACOES_ITENS: 'consignacoes_itens',
  MOVIMENTACOES_COMERCIAIS: 'movimentacoes_comerciais',
  MOVIMENTACOES_PERFIL: 'movimentacoes_perfil_comercial'
});

const PERFIL_TIPOS = Object.freeze([
  'CONSUMIDOR',
  'ATACADISTA',
  'CONSIGNADO',
  'DISTRIBUIDOR',
  'REPRESENTANTE'
]);

const STATUS_CONSIGNACAO = Object.freeze([
  'RASCUNHO',
  'ENTREGUE',
  'ACERTADA',
  'QUITADA',
  'ENCERRADA',
  'CANCELADA'
]);

const SITUACAO_DOCUMENTO = Object.freeze([
  'RASCUNHO',
  'ATIVO',
  'CANCELADO',
  'SUBSTITUIDO'
]);

const STATUS_PRESTACAO = Object.freeze([
  'ABERTA',
  'FECHADA'
]);

const ORIGENS_MOVIMENTACAO = Object.freeze([
  'USUARIO',
  'PDV',
  'API',
  'IMPORTACAO',
  'APP_COMERCIAL',
  'ROTINA',
  'INTEGRACAO',
  'SISTEMA'
]);

module.exports = {
  TABELAS,
  PERFIL_TIPOS,
  STATUS_CONSIGNACAO,
  SITUACAO_DOCUMENTO,
  STATUS_PRESTACAO,
  ORIGENS_MOVIMENTACAO
};
