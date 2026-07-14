/**
 * Motor Comercial — Fachada pública
 *
 * Sprint S-4.1: inicialização determinística e fail-fast.
 *
 * @module motores/motor-comercial
 */

const InfrastructureError = require('./infrastructure/errors/InfrastructureError');
const { executarBootstrap } = require('./infrastructure/bootstrap/MotorComercialBootstrap');

const VERSAO_MODULO = 'S-4.1-hardening';

/** @type {import('./infrastructure/di/ComercialDependencyContainer')|null} */
let containerPadrao = null;
let inicializado = false;

/**
 * @returns {boolean}
 */
function estaInicializado() {
  return inicializado && containerPadrao != null;
}

/**
 * @returns {import('./infrastructure/di/ComercialDependencyContainer')}
 */
function obterContainer() {
  if (!estaInicializado()) {
    throw new InfrastructureError(
      'Motor Comercial não inicializado. Chame inicializar() antes de obter o container.'
    );
  }
  return containerPadrao;
}

/**
 * Inicializa o Motor Comercial.
 * @param {Object} [opcoes]
 * @param {Object} [opcoes.db]
 * @returns {Promise<void>}
 */
async function inicializar(opcoes = {}) {
  if (estaInicializado()) {
    return;
  }

  const db = opcoes.db ?? require('../../database');
  containerPadrao = await executarBootstrap({ db });
  inicializado = true;
}

/**
 * Encerra o Motor Comercial e libera recursos.
 * @returns {Promise<void>}
 */
async function encerrar() {
  if (containerPadrao) {
    containerPadrao.limpar();
    containerPadrao = null;
  }
  inicializado = false;
}

module.exports = {
  inicializar,
  encerrar,
  obterContainer,
  estaInicializado,
  InfrastructureError,
  VERSAO_MODULO,
  infrastructure: require('./infrastructure'),
  contracts: require('./domain/contracts'),
  errors: require('./domain/errors'),
  repositories: require('./repositories'),
  dto: require('./dto'),
  projections: require('./services/projections'),
  usecases: {
    perfil: require('./usecases/perfil'),
    consignacao: require('./usecases/consignacao')
  }
};
