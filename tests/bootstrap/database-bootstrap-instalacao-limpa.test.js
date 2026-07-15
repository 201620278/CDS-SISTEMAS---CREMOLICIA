/**
 * Teste: instalação limpa — bootstrap + login SUPER_ADMIN.
 * Garante que banco novo sobe sem intervenção manual.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');
const bcrypt = require('bcryptjs');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cds-bootstrap-'));
const dbDir = path.join(tmpDir, 'dados');
fs.mkdirSync(dbDir, { recursive: true });

process.env.DB_DIR = dbDir;
process.env.PORT = '0';
delete process.env.ADMIN_SEED_PASSWORD;

const dbPath = path.join(dbDir, 'mercadao.db');
assert.ok(!fs.existsSync(dbPath), 'Banco não deve existir antes do teste');

const db = require('../../backend/database');
const {
  SUPER_ADMIN_USERNAME,
  SUPER_ADMIN_PASSWORD_PADRAO,
  compararSenhaBootstrap
} = require('../../backend/lib/DatabaseBootstrapService');

function whenReady() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout aguardando bootstrap')), 60000);
    db.whenReady((err) => {
      clearTimeout(timeout);
      if (err) reject(err);
      else resolve();
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

async function run() {
  console.log('DB_DIR teste:', dbDir);
  await whenReady();

  assert.ok(db.isReady(), 'db.isReady() deve ser true após bootstrap');
  assert.ok(fs.existsSync(dbPath), 'Arquivo do banco deve existir');

  const tabelas = ['configuracoes', 'usuarios', 'usuario_permissoes', 'produtos', 'caixas'];
  for (const tabela of tabelas) {
    const row = await dbGet(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [tabela]
    );
    assert.ok(row, `Tabela obrigatória ausente: ${tabela}`);
  }

  const cfg = await dbGet(`SELECT COUNT(*) AS total FROM configuracoes`);
  assert.ok(Number(cfg.total) > 0, 'configuracoes não pode estar vazia');

  const usuario = await dbGet(
    `SELECT * FROM usuarios WHERE username = ?`,
    [SUPER_ADMIN_USERNAME]
  );
  assert.ok(usuario, 'SUPER_ADMIN Diego deve existir');
  assert.strictEqual(usuario.perfil, 'SUPER_ADMIN');
  assert.strictEqual(Number(usuario.ativo ?? 1), 1);
  assert.ok(usuario.password_hash, 'password_hash obrigatório');
  assert.ok(
    compararSenhaBootstrap(SUPER_ADMIN_PASSWORD_PADRAO, usuario.password_hash),
    'Senha padrão pdb100623 deve validar via bcrypt.compare'
  );
  assert.ok(
    bcrypt.compareSync(SUPER_ADMIN_PASSWORD_PADRAO, usuario.password_hash),
    'bcrypt.compareSync direto também deve validar'
  );

  // Idempotência: segundo bootstrap não deve falhar nem criar segundo usuário
  const { executarBootstrap } = require('../../backend/lib/DatabaseBootstrapService');
  await executarBootstrap(db, { migrationsJaExecutadas: true });
  const contagem = await dbGet(`SELECT COUNT(*) AS total FROM usuarios WHERE username = ?`, [
    SUPER_ADMIN_USERNAME
  ]);
  assert.strictEqual(Number(contagem.total), 1, 'Deve haver exatamente 1 usuário Diego');

  console.log('OK: instalação limpa bootstrapped e login Diego/pdb100623 válido.');
  try {
    db.close(() => process.exit(0));
  } catch {
    process.exit(0);
  }
  setTimeout(() => process.exit(0), 2000).unref();
}

run().catch((err) => {
  console.error('FALHA:', err);
  try {
    db.close(() => process.exit(1));
  } catch {
    process.exit(1);
  }
  setTimeout(() => process.exit(1), 2000).unref();
});
