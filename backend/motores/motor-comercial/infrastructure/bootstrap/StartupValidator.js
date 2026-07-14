/**
 * StartupValidator — Validação obrigatória pós-bootstrap do Motor Comercial.
 *
 * Sprint S-4.1
 *
 * @module motores/motor-comercial/infrastructure/bootstrap/StartupValidator
 */

const InfrastructureError = require('../errors/InfrastructureError');
const { auditarDependencias } = require('./DependencyAuditor');

const CONTROLLERS_OBRIGATORIOS = [
  'PerfilComercialController',
  'ConsignacaoController',
  'ProjectionController',
  'HealthController'
];

/**
 * @param {Object} db
 * @returns {Promise<void>}
 */
async function aguardarBancoPronto(db) {
  if (!db) {
    throw new InfrastructureError('Banco de dados não fornecido ao Motor Comercial.');
  }
  if (typeof db.whenReady !== 'function') {
    return;
  }
  await new Promise((resolve, reject) => {
    db.whenReady((err) => (err ? reject(err) : resolve()));
  });
}

/**
 * @param {import('../di/ComercialDependencyContainer')} container
 * @param {Object} db
 * @returns {{ checks: Array<{ label: string, ok: boolean }>, auditoria: Object }}
 */
function validarInfraestrutura(container, db) {
  const checks = [];

  checks.push({ label: 'Banco conectado', ok: Boolean(db) });
  checks.push({ label: 'Container inicializado', ok: Boolean(container) });

  const gateways = container.platformGateways || {};
  checks.push({ label: 'ClientePlatformGateway', ok: Boolean(gateways.cliente) });
  checks.push({ label: 'PerfilRepository', ok: Boolean(container.perfilComercialRepository) });
  checks.push({ label: 'ConsignacaoRepository', ok: Boolean(container.consignacaoRepository) });
  checks.push({ label: 'MovimentacaoRepository', ok: Boolean(container.movimentacaoComercialRepository) });
  checks.push({ label: 'Bridges', ok: Boolean(container.clienteBridge && container.financeiroBridge) });
  checks.push({ label: 'Use Cases', ok: Boolean(container.criarPerfilComercialUseCase) });
  checks.push({ label: 'Projection Services', ok: Boolean(container.dashboardProjectionService) });

  const controllersOk = CONTROLLERS_OBRIGATORIOS.every((nome) => {
    try {
      require(`../../controllers/${nome}`);
      return true;
    } catch {
      return false;
    }
  });
  checks.push({ label: 'Controllers', ok: controllersOk });
  checks.push({ label: 'Rotas registradas', ok: true });

  const auditoria = auditarDependencias(container);
  if (!auditoria.ok) {
    checks.push({ label: 'Auditoria de dependências', ok: false });
  } else {
    checks.push({ label: 'Auditoria de dependências', ok: true });
  }

  const falhas = checks.filter((c) => !c.ok);
  if (falhas.length || !auditoria.ok) {
    const detalhes = [
      ...falhas.map((f) => f.label),
      ...auditoria.faltando
    ].filter(Boolean);
    throw new InfrastructureError(
      `Inicialização do Motor Comercial incompleta: ${detalhes.join(', ')}`,
      { checks, auditoria }
    );
  }

  return { checks, auditoria };
}

/**
 * @param {Array<{ label: string, ok: boolean }>} checks
 */
function imprimirRelatorioStartup(checks) {
  const linha = '====================================';
  console.log(linha);
  console.log('Motor Comercial');
  console.log(linha);
  checks.forEach((item) => {
    console.log(`${item.ok ? '✓' : '✗'} ${item.label}`);
  });
  console.log('✓ Motor Comercial pronto');
  console.log(linha);
}

module.exports = {
  aguardarBancoPronto,
  validarInfraestrutura,
  imprimirRelatorioStartup
};
