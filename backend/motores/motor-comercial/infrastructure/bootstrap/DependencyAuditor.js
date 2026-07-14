/**
 * DependencyAuditor — Auditoria interna de dependências do Motor Comercial.
 *
 * Sprint S-4.1
 *
 * @module motores/motor-comercial/infrastructure/bootstrap/DependencyAuditor
 */

const DEPENDENCIAS_OBRIGATORIAS = [
  'perfilComercialRepository',
  'consignacaoRepository',
  'consignacaoItemRepository',
  'movimentacaoComercialRepository',
  'movimentacaoPerfilRepository',
  'clienteBridge',
  'produtoBridge',
  'estoqueBridge',
  'financeiroBridge',
  'usuarioBridge',
  'platformGateways',
  'criarPerfilComercialUseCase',
  'dashboardProjectionService',
  'contaCorrenteProjectionService',
  'situacaoClienteProjectionService'
];

const TOKENS_DI_OBRIGATORIOS = [
  'db',
  'unitOfWork',
  'eventPublisher',
  'repositoryFactory'
];

const PROJECTION_SERVICES = [
  'indicadoresProjectionService',
  'saldoProjectionService',
  'dashboardProjectionService',
  'contaCorrenteProjectionService',
  'timelineProjectionService',
  'resumoPrestacaoProjectionService',
  'historicoProjectionService',
  'situacaoClienteProjectionService',
  'insightsProjectionService',
  'pendenciasProjectionService',
  'recomendacoesProjectionService',
  'playbooksProjectionService',
  'workflowProjectionService'
];

const GATEWAYS_OBRIGATORIOS = ['cliente', 'produto', 'estoque', 'financeiro', 'usuario'];

/**
 * @param {import('../di/ComercialDependencyContainer')} container
 * @returns {{ ok: boolean, faltando: string[], avisos: string[], gateways: string[], projections: string[] }}
 */
function auditarDependencias(container) {
  const faltando = DEPENDENCIAS_OBRIGATORIAS.filter((chave) => !container[chave]);
  const tokensFaltando = TOKENS_DI_OBRIGATORIOS.filter((token) => !container.possui(token));
  if (tokensFaltando.length) {
    faltando.push(...tokensFaltando.map((t) => `token:${t}`));
  }
  const projections = PROJECTION_SERVICES.filter((chave) => !container[chave]);
  const avisos = [];

  if (projections.length) {
    avisos.push(`Projection services ausentes: ${projections.join(', ')}`);
  }

  const gateways = container.platformGateways || {};
  const gatewaysFaltando = GATEWAYS_OBRIGATORIOS.filter((nome) => !gateways[nome]);
  if (gatewaysFaltando.length) {
    faltando.push(...gatewaysFaltando.map((g) => `platformGateways.${g}`));
  }

  return {
    ok: faltando.length === 0,
    faltando,
    avisos,
    gateways: GATEWAYS_OBRIGATORIOS.filter((nome) => Boolean(gateways[nome])),
    projections: PROJECTION_SERVICES.filter((chave) => Boolean(container[chave]))
  };
}

module.exports = {
  DEPENDENCIAS_OBRIGATORIAS,
  TOKENS_DI_OBRIGATORIOS,
  PROJECTION_SERVICES,
  auditarDependencias
};
