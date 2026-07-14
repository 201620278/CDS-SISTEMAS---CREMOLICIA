/**
 * Testes — Resilience Enterprise Pipeline (Sprint P-3)
 * Executar: npm run test:motor-comercial-resilience
 */

const assert = require('assert');
const {
  criarResilienceConfiguration,
  criarResilienceRegistry,
  wrapBridgeWithResilience,
  RetryPolicy,
  CircuitBreaker,
  TimeoutPolicy,
  FallbackPolicy,
  ResilienceChain
} = require('../../backend/motores/motor-comercial/bridges/resilience');

let passou = 0;
let falhou = 0;

function test(nome, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => { passou += 1; console.log(`  OK  ${nome}`); })
    .catch((err) => { falhou += 1; console.error(`  FALHOU  ${nome}\n         ${err.message}`); });
}

function criarBridgeMock(comportamento = {}) {
  return {
    async buscarPorId(id) {
      if (comportamento.buscarPorId) return comportamento.buscarPorId(id);
      return { id, ativo: true };
    },
    async registrarReceitaConsignacao(dados) {
      if (comportamento.registrarReceitaConsignacao) {
        return comportamento.registrarReceitaConsignacao(dados);
      }
      return { ok: true, ...dados };
    }
  };
}

async function run() {
  console.log('\n=== Testes Resilience Enterprise — Sprint P-3 ===\n');

  await test('Configuração central — parâmetros customizáveis', async () => {
    const config = criarResilienceConfiguration({
      global: { maxRetries: 5, timeout: 15000, breakerThreshold: 3, cooldown: 30000 },
      bridges: { Financeiro: { maxRetries: 7, fallbackEnabled: true } }
    });

    assert.strictEqual(config.global.maxRetries, 5);
    assert.strictEqual(config.getBridgeConfig('Financeiro').maxRetries, 7);
    assert.strictEqual(config.getBridgeConfig('Financeiro').fallbackEnabled, true);
    assert.strictEqual(config.getBridgeConfig('Cliente').maxRetries, 5);
  });

  await test('wrapBridgeWithResilience — executa via ResilienceChain', async () => {
    let chamadas = 0;
    const registry = criarResilienceRegistry({
      config: criarResilienceConfiguration({
        global: { maxRetries: 1, retryDelay: 1, timeout: 5000, breakerThreshold: 10 }
      })
    });

    const bridge = wrapBridgeWithResilience(criarBridgeMock({
      buscarPorId: async (id) => {
        chamadas += 1;
        return { id, nome: 'Cliente Teste' };
      }
    }), 'Cliente', registry);

    const resultado = await bridge.buscarPorId(10);
    assert.strictEqual(resultado.id, 10);
    assert.strictEqual(chamadas, 1);

    const stats = registry.getDiagnostic().obterEstatisticas();
    assert.ok(stats.porBridge.some((b) => b.bridge === 'Cliente' && b.sucesso >= 1));
  });

  await test('Retry — bridge indisponível e recuperação', async () => {
    let tentativas = 0;
    const registry = criarResilienceRegistry({
      config: criarResilienceConfiguration({
        global: { maxRetries: 2, retryDelay: 1, timeout: 5000, breakerThreshold: 20 }
      })
    });

    const bridge = wrapBridgeWithResilience(criarBridgeMock({
      registrarReceitaConsignacao: async () => {
        tentativas += 1;
        if (tentativas < 2) {
          const erro = new Error('network timeout');
          erro.code = 'ETIMEDOUT';
          throw erro;
        }
        return { ok: true };
      }
    }), 'Financeiro', registry);

    const resultado = await bridge.registrarReceitaConsignacao({ consignacaoId: 1, correlationId: 'corr-retry' });
    assert.strictEqual(resultado.ok, true);
    assert.ok(tentativas >= 2);
  });

  await test('Circuit Breaker — abre após threshold', async () => {
    const registry = criarResilienceRegistry({
      config: criarResilienceConfiguration({
        global: { maxRetries: 0, retryDelay: 1, timeout: 5000, breakerThreshold: 2, cooldown: 60000 }
      })
    });

    const bridge = wrapBridgeWithResilience(criarBridgeMock({
      buscarPorId: async () => { throw new Error('servico indisponivel'); }
    }), 'Produto', registry);

    await assert.rejects(() => bridge.buscarPorId(1));
    await assert.rejects(() => bridge.buscarPorId(1));

    const chain = registry.getChain('Produto');
    assert.strictEqual(chain.getCircuitBreakerStats().state, 'OPEN');

    await assert.rejects(
      () => bridge.buscarPorId(1),
      (err) => err.message.includes('Circuit breaker is OPEN')
    );

    const cbs = registry.getDiagnostic().obterCircuitBreakers(registry.getAllChains());
    const produto = cbs.find((c) => c.bridge === 'Produto');
    assert.strictEqual(produto.state, 'OPEN');
  });

  await test('Timeout — operação excede limite', async () => {
    const registry = criarResilienceRegistry({
      config: criarResilienceConfiguration({
        global: { maxRetries: 0, timeout: 20, breakerThreshold: 50 }
      })
    });

    const bridge = wrapBridgeWithResilience(criarBridgeMock({
      buscarPorId: async () => new Promise((resolve) => setTimeout(() => resolve({ id: 1 }), 200))
    }), 'Usuario', registry);

    await assert.rejects(
      () => bridge.buscarPorId(1),
      (err) => err.message.includes('timed out')
    );

    const stats = registry.getDiagnostic().obterEstatisticas();
    const usuario = stats.porBridge.find((b) => b.bridge === 'Usuario');
    assert.ok(usuario.timeout >= 1);
  });

  await test('Fallback — habilitado retorna envelope', async () => {
    const registry = criarResilienceRegistry({
      config: criarResilienceConfiguration({
        bridges: {
          Estoque: {
            maxRetries: 0,
            timeout: 5000,
            breakerThreshold: 50,
            fallbackEnabled: true
          }
        }
      })
    });

    const bridge = wrapBridgeWithResilience(criarBridgeMock({
      registrarReceitaConsignacao: async () => { throw new Error('estoque offline'); }
    }), 'Estoque', registry);

    const resultado = await bridge.registrarReceitaConsignacao({ consignacaoId: 1 });
    assert.strictEqual(resultado._resilienceFallback, true);
    assert.strictEqual(resultado.bridge, 'Estoque');

    const stats = registry.getDiagnostic().obterEstatisticas();
    const estoque = stats.porBridge.find((b) => b.bridge === 'Estoque');
    assert.ok(estoque.fallback >= 1);
  });

  await test('ResilienceChain — pipeline Retry + Circuit + Timeout', async () => {
    const chain = ResilienceChain.create({
      retryPolicy: RetryPolicy.create({ maxRetries: 1, initialDelay: 1 }),
      circuitBreaker: CircuitBreaker.create({ failureThreshold: 10 }),
      timeoutPolicy: TimeoutPolicy.create({ timeout: 1000 })
    });

    const resultado = await chain.execute(async () => 'ok');
    assert.strictEqual(resultado, 'ok');
  });

  await test('Idempotência — chamadas repetidas após sucesso mantêm circuit fechado', async () => {
    const registry = criarResilienceRegistry();
    const bridge = wrapBridgeWithResilience(criarBridgeMock(), 'Cliente', registry);

    await bridge.buscarPorId(1);
    await bridge.buscarPorId(1);

    assert.strictEqual(registry.getChain('Cliente').getCircuitBreakerStats().state, 'CLOSED');
    const stats = registry.getDiagnostic().obterEstatisticas();
    const cliente = stats.porBridge.find((b) => b.bridge === 'Cliente');
    assert.strictEqual(cliente.sucesso, 2);
  });

  console.log(`\n--- Resultado: ${passou} passou, ${falhou} falhou ---\n`);
  if (falhou > 0) process.exit(1);
}

run();
