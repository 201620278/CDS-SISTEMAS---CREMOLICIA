const test = require('node:test');
const assert = require('node:assert/strict');

const InsightEngine = require('../engine/InsightEngine');
const InsightRegistry = require('../registry/InsightRegistry');
const InsightContext = require('../context/InsightContext');

class DemoRule {
  codigo() { return 'demo-rule'; }
  categoria() { return 'OPERACIONAL'; }
  prioridade() { return 'NORMAL'; }
  severidade() { return 'INFO'; }
  async executar(context) {
    return {
      codigo: this.codigo(),
      categoria: this.categoria(),
      titulo: 'Demo insight',
      mensagem: `Processado para ${context.empresa || 'default'}`,
      dados: { ok: true }
    };
  }
}

test('InsightEngine executa regras registradas e retorna resultado padronizado', async () => {
  const registry = new InsightRegistry();
  registry.registrar(new DemoRule());

  const engine = new InsightEngine({ registry });
  const context = new InsightContext({ empresa: 'CDS' });

  const result = await engine.executar(context);

  assert.equal(result.quantidade, 1);
  assert.equal(result.insights[0].codigo, 'demo-rule');
  assert.equal(result.categorias[0], 'OPERACIONAL');
  assert.equal(result.severidades[0], 'INFO');
});
