/**
 * MotorComercialBootstrap — Ordem oficial de inicialização.
 *
 * Sprint S-4.1
 *
 * Banco → Container → Repositories → Bridges → Outbox → Use Cases → Projections → Validação
 *
 * @module motores/motor-comercial/infrastructure/bootstrap/MotorComercialBootstrap
 */

const InfrastructureError = require('../errors/InfrastructureError');
const { criarContainerPadrao } = require('../di');
const {
  aguardarBancoPronto,
  validarInfraestrutura,
  imprimirRelatorioStartup
} = require('./StartupValidator');

/**
 * @param {Object} opcoes
 * @param {Object} opcoes.db
 * @returns {Promise<import('../di/ComercialDependencyContainer')>}
 */
async function executarBootstrap(opcoes = {}) {
  const db = opcoes.db;
  if (!db) {
    throw new InfrastructureError(
      'Banco de dados obrigatório. Inicialização do Motor Comercial cancelada.'
    );
  }

  await aguardarBancoPronto(db);

  const container = criarContainerPadrao({ db });
  const { checks } = validarInfraestrutura(container, db);
  imprimirRelatorioStartup(checks);

  return container;
}

module.exports = {
  executarBootstrap
};
