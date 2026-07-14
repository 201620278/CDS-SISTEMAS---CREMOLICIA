/**
 * Testes — Bridge Adapters e Platform Gateways (Sprint O-13)
 * Executar: npm run test:motor-comercial-bridges
 */

const assert = require('assert');
const { resetBridgeDiagnosticService } = require('../../backend/motores/motor-comercial/bridges/diagnostic/BridgeDiagnosticService');
const { criarBridgeAdapters } = require('../../backend/motores/motor-comercial/bridges/adapters');

let passou = 0;
let falhou = 0;

function test(nome, fn) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => { passou += 1; console.log(`  OK  ${nome}`); })
    .catch((error) => {
      falhou += 1;
      console.error(`  FALHOU  ${nome}`);
      console.error(`         ${error.message}`);
    });
}

function criarDbMock(dados = {}) {
  const clientes = dados.clientes ?? [{ id: 10, nome: 'Cliente Real', cpf_cnpj: '123', limite_credito: 1000, credito_atual: 0 }];
  const produtos = dados.produtos ?? [{ id: 5, nome: 'Produto Real', preco_venda: 25, estoque_atual: 50, saldo_fiscal: 0, saldo_nao_fiscal: 50, ativo: 1, item_fiscal: 0, unidade: 'UN' }];
  const usuarios = dados.usuarios ?? [{ id: 1, username: 'admin', nome: 'Admin', role: 'admin', perfil: 'ADMIN', ativo: 1 }];

  return {
    get(sql, params, cb) {
      if (sql.includes('FROM clientes')) {
        const row = clientes.find((c) => String(c.id) === String(params[0]));
        return cb(null, row ?? undefined);
      }
      if (sql.includes('FROM produtos')) {
        const row = produtos.find((p) => String(p.id) === String(params[0]));
        return cb(null, row ?? undefined);
      }
      if (sql.includes('FROM usuarios')) {
        const row = usuarios.find((u) => String(u.id) === String(params[0]));
        return cb(null, row ?? undefined);
      }
      if (sql.includes('FROM contas_receber')) {
        return cb(null, { total_em_aberto: 0 });
      }
      if (sql.includes('FROM consignacoes')) {
        return cb(null, { id: params[0], cliente_id: 10, cliente_nome: 'Cliente Real' });
      }
      return cb(null, undefined);
    },
    all(sql, params, cb) {
      if (sql.includes('contas_receber')) return cb(null, []);
      if (sql.includes('usuario_permissoes')) return cb(null, [{ permissao: 'COMERCIAL_CONSIGNACAO' }]);
      return cb(null, []);
    },
    run(sql, params, cb) {
      if (typeof cb === 'function') {
        cb.call({ lastID: 99, changes: 1 }, null);
      }
    }
  };
}

async function run() {
  resetBridgeDiagnosticService();
  console.log('\n=== Testes Bridges O-13 — Integração Plataforma ===\n');

  await test('ClienteBridgeAdapter — buscarPorId real', async () => {
    const { clienteBridge } = criarBridgeAdapters({ db: criarDbMock() });
    const cliente = await clienteBridge.buscarPorId(10);
    assert.ok(cliente);
    assert.strictEqual(cliente.nome, 'Cliente Real');
    assert.strictEqual(cliente.origem, 'platform:clientes');
  });

  await test('ProdutoBridgeAdapter — estaAtivo real', async () => {
    const { produtoBridge } = criarBridgeAdapters({ db: criarDbMock() });
    const ativo = await produtoBridge.estaAtivo(5);
    assert.strictEqual(ativo, true);
  });

  await test('UsuarioBridgeAdapter — possuiPermissao admin', async () => {
    const { usuarioBridge } = criarBridgeAdapters({ db: criarDbMock() });
    const ok = await usuarioBridge.possuiPermissao(1, 'COMERCIAL_CONSIGNACAO');
    assert.strictEqual(ok, true);
  });

  await test('BridgeDiagnosticService — registra chamadas', async () => {
    const { bridgeDiagnosticService, clienteBridge } = criarBridgeAdapters({ db: criarDbMock() });
    await clienteBridge.buscarPorId(10);
    const resumo = bridgeDiagnosticService.getSummary();
    assert.ok(resumo.total >= 1);
    assert.ok(resumo.bridges.Cliente);
  });

  await test('FinanceiroBridgeAdapter — registrarReceitaConsignacao', async () => {
    const db = criarDbMock();
    const { financeiroBridge } = criarBridgeAdapters({ db });
    const result = await financeiroBridge.registrarReceitaConsignacao({
      consignacaoId: 1,
      valor: 100,
      correlationId: 'corr-test'
    });
    assert.strictEqual(result.origem, 'platform:financeiro');
  });

  console.log(`\nResultado: ${passou} ok, ${falhou} falhou\n`);
  if (falhou > 0) process.exit(1);
}

run();
