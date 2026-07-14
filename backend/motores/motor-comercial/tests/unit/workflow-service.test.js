/**
 * Testes — WorkflowService (Sprint O-11)
 * Executar: node backend/motores/motor-comercial/tests/unit/workflow-service.test.js
 */

const assert = require('assert');
const { WorkflowService, calcularSla, buildWorkflowId } = require('../../services/workflow/WorkflowService');

let passou = 0;
let falhou = 0;

function test(nome, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => { passou += 1; console.log(`  OK  ${nome}`); })
    .catch((err) => { falhou += 1; console.error(`  FALHOU  ${nome}\n         ${err.message}`); });
}

async function run() {
  console.log('\nWorkflowService — Sprint O-11\n');
  const service = new WorkflowService();

  await test('executar combina pendências, recomendações e playbooks', () => {
    const result = service.executar({
      pendencias: {
        alertas: [{
          id: 'a1',
          descricao: 'Saldo em aberto',
          prioridade: 'HIGH',
          severidade: 'HIGH',
          clienteId: 1,
          data: new Date().toISOString()
        }]
      },
      recomendacoes: {
        recomendacoes: [{
          id: 'r1',
          titulo: 'Cobrar cliente',
          prioridade: 'URGENT',
          status: 'NOVA',
          clienteId: 1,
          data: new Date().toISOString()
        }]
      },
      playbooks: {
        sugeridos: [{
          id: 'PB-001',
          nome: 'Cobrança',
          score: 90,
          categoria: 'COBRANCA',
          tempoEstimadoMinutos: 30
        }]
      }
    });

    assert.ok(result.workflows.length > 0);
    assert.ok(result.kanban);
    assert.ok(result.resumo.workflowsAtivos > 0);
    assert.ok(result.fila.length > 0);
    assert.ok(result.distribuicao.length > 0);
  });

  await test('calcularSla retorna indicador verde para prazo distante', () => {
    const sla = calcularSla('NORMAL', 'INFO', new Date().toISOString());
    assert.strictEqual(sla.status, 'DENTRO');
    assert.strictEqual(sla.indicador, 'verde');
  });

  await test('buildWorkflowId gera id estável', () => {
    assert.strictEqual(
      buildWorkflowId('PEND', 'x', 1, 2),
      buildWorkflowId('PEND', 'x', 1, 2)
    );
  });

  console.log(`\nResultado: ${passou} ok, ${falhou} falhou\n`);
  if (falhou > 0) process.exit(1);
}

run();
