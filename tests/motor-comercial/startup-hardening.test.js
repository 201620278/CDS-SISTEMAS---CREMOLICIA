/**
 * Testes de hardening da inicialização — Sprint S-4.1
 */

const assert = require('assert');
const InfrastructureError = require('../../backend/motores/motor-comercial/infrastructure/errors/InfrastructureError');
const { criarContainerPadrao } = require('../../backend/motores/motor-comercial/infrastructure/di');
const { auditarDependencias } = require('../../backend/motores/motor-comercial/infrastructure/bootstrap/DependencyAuditor');
const { exigirBancoNosDeps } = require('../../backend/motores/motor-comercial/bridges/platform/platformGatewayGuards');

function criarDbMock() {
  return {
    whenReady(cb) { cb(null); },
    get(sql, params, cb) { cb(null, { id: 1, nome: 'Teste' }); },
    all(sql, params, cb) { cb(null, []); },
    run(sql, params, cb) { cb.call({ lastID: 1, changes: 1 }, null); }
  };
}

async function testContainerSemBancoFalha() {
  let falhou = false;
  try {
    criarContainerPadrao({});
  } catch (error) {
    falhou = error instanceof InfrastructureError;
  }
  assert.strictEqual(falhou, true, 'Container sem banco deve falhar');
}

async function testObterContainerSemInicializar() {
  const motorPath = require.resolve('../../backend/motores/motor-comercial/index.js');
  delete require.cache[motorPath];
  const motor = require('../../backend/motores/motor-comercial/index.js');
  await motor.encerrar();

  let falhou = false;
  try {
    motor.obterContainer();
  } catch (error) {
    falhou = error instanceof InfrastructureError;
  }
  assert.strictEqual(falhou, true, 'obterContainer sem inicializar deve falhar');
}

async function testInicializacaoCompleta() {
  const motorPath = require.resolve('../../backend/motores/motor-comercial/index.js');
  delete require.cache[motorPath];
  const motor = require('../../backend/motores/motor-comercial/index.js');
  await motor.encerrar();

  const db = criarDbMock();
  await motor.inicializar({ db });
  assert.strictEqual(motor.estaInicializado(), true);

  const container = motor.obterContainer();
  const auditoria = auditarDependencias(container);
  assert.strictEqual(auditoria.ok, true, `Dependências faltando: ${auditoria.faltando.join(', ')}`);

  await motor.inicializar({ db });
  assert.strictEqual(motor.estaInicializado(), true, 'Inicialização duplicada deve ser idempotente');

  await motor.encerrar();
}

function testGatewaySemBancoFalha() {
  let falhou = false;
  try {
    exigirBancoNosDeps({}, 'TesteGateway');
  } catch (error) {
    falhou = error instanceof InfrastructureError;
  }
  assert.strictEqual(falhou, true);
}

async function run() {
  await testContainerSemBancoFalha();
  await testObterContainerSemInicializar();
  await testInicializacaoCompleta();
  testGatewaySemBancoFalha();
  console.log('startup-hardening.test.js: 4 cenários OK');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
