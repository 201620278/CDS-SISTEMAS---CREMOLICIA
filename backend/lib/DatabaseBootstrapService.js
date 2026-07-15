/**
 * DatabaseBootstrapService
 *
 * Garante que uma instalação limpa (banco novo) fique operacional
 * antes de qualquer tela/API: schema crítico, configurações e SUPER_ADMIN.
 *
 * Idempotente — seguro executar em toda subida do processo.
 */

const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 10;
const SUPER_ADMIN_USERNAME = 'Diego';
const SUPER_ADMIN_NOME = 'Diego';
const SUPER_ADMIN_PASSWORD_PADRAO = 'pdb100623';

const TABELAS_OBRIGATORIAS = [
  'configuracoes',
  'usuarios',
  'usuario_permissoes',
  'produtos',
  'clientes',
  'fornecedores',
  'vendas',
  'compras',
  'financeiro',
  'caixas',
  'terminais',
  'caixa',
  'auditoria'
];

const CONFIGURACOES_PADRAO = [
  ['nome_empresa', 'Mercadão da Economia', 'string', 'Nome da empresa'],
  ['nome_fantasia', '', 'string', 'Nome fantasia'],
  ['razao_social', '', 'string', 'Razão social'],
  ['cnpj', '', 'string', 'CNPJ da empresa'],
  ['ie', '', 'string', 'Inscrição estadual'],
  ['im', '', 'string', 'Inscrição municipal'],
  ['telefone', '', 'string', 'Telefone para contato'],
  ['whatsapp', '', 'string', 'WhatsApp'],
  ['email', '', 'string', 'Email para contato'],
  ['cep', '', 'string', 'CEP'],
  ['logradouro', '', 'string', 'Logradouro'],
  ['numero', '', 'string', 'Número'],
  ['complemento', '', 'string', 'Complemento'],
  ['bairro', '', 'string', 'Bairro'],
  ['cidade', '', 'string', 'Cidade'],
  ['uf', 'CE', 'string', 'UF'],
  ['endereco', '', 'text', 'Endereço da empresa'],
  ['fiscal_ambiente', '2', 'number', '1=produção, 2=homologação'],
  ['fiscal_uf_sigla', 'CE', 'string', 'UF emitente'],
  ['fiscal_codigo_uf', '23', 'string', 'Código IBGE da UF emitente'],
  ['fiscal_serie', '1', 'number', 'Série da NFC-e'],
  ['fiscal_numero_atual', '1', 'number', 'Próximo número da NFC-e'],
  ['fiscal_regime_tributario', '1', 'string', 'CRT do emitente'],
  ['fiscal_ie', '', 'string', 'Inscrição estadual'],
  ['fiscal_im', '', 'string', 'Inscrição municipal'],
  ['fiscal_cnae', '', 'string', 'CNAE fiscal'],
  ['fiscal_certificado_path', '', 'string', 'Caminho do certificado A1/PFX'],
  ['fiscal_certificado_senha', '', 'string', 'Senha do certificado A1/PFX'],
  ['fiscal_id_csc', '', 'string', 'Identificador CSC'],
  ['fiscal_token_csc', '', 'string', 'Token CSC'],
  ['fiscal_ws_autorizacao_homologacao', 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx', 'string', 'WS autorização homologação'],
  ['fiscal_ws_retorno_homologacao', 'https://nfce-homologacao.svrs.rs.gov.br/ws/NFeRetAutorizacao/NFeRetAutorizacao4.asmx', 'string', 'WS retorno homologação'],
  ['fiscal_ws_status_homologacao', 'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx', 'string', 'WS status homologação'],
  ['fiscal_csc_qrcode_url_homologacao', 'https://nfceh.sefaz.ce.gov.br/pages/ShowNFCe.html', 'string', 'Base QR Code homologação CE'],
  ['fiscal_consulta_chave_url_homologacao', 'https://nfceh.sefaz.ce.gov.br/pages/ShowNFCe.html', 'string', 'Consulta chave homologação CE'],
  ['fiscal_ws_autorizacao_producao', 'https://nfce.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx', 'string', 'WS autorização produção'],
  ['fiscal_ws_retorno_producao', 'https://nfce.svrs.rs.gov.br/ws/NFeRetAutorizacao/NFeRetAutorizacao4.asmx', 'string', 'WS retorno produção'],
  ['fiscal_ws_status_producao', 'https://nfce.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx', 'string', 'WS status produção'],
  ['fiscal_csc_qrcode_url_producao', 'https://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html', 'string', 'Base QR Code produção CE'],
  ['fiscal_consulta_chave_url_producao', 'https://nfce.sefaz.ce.gov.br/pages/ShowNFCe.html', 'string', 'Consulta chave produção CE'],
  ['fiscal_tp_imp', '4', 'number', 'Tipo impressão DANFE NFC-e'],
  ['fiscal_municipio_codigo', '2307304', 'string', 'Código município emitente'],
  ['fiscal_municipio_nome', 'Juazeiro do Norte', 'string', 'Nome município emitente'],
  ['fiscal_emitente_cep', '', 'string', 'CEP emitente'],
  ['fiscal_emitente_logradouro', '', 'string', 'Logradouro emitente'],
  ['fiscal_emitente_numero', 'S/N', 'string', 'Número emitente'],
  ['fiscal_emitente_bairro', '', 'string', 'Bairro emitente'],
  ['logo', '', 'text', 'URL da logo'],
  ['imprimir_cupom', 'true', 'boolean', 'Imprimir cupom fiscal'],
  ['juros_mora', '1.0', 'decimal', 'Juros de mora por dia (%)'],
  ['backup_google_enabled', 'false', 'boolean', 'Backup automático para Google Drive habilitado'],
  ['backup_google_frequency', '0 2 * * *', 'string', 'Frequência de backup para Google Drive'],
  ['backup_google_client_id', '', 'string', 'Google Client ID para backup'],
  ['backup_google_client_secret', '', 'string', 'Google Client Secret para backup'],
  ['backup_google_redirect_uris', '[]', 'text', 'Google Redirect URIs para OAuth'],
  ['backup_google_refresh_token', '', 'text', 'Google Refresh Token para backup'],
  ['tef_ativo', 'true', 'boolean', 'TEF habilitado'],
  ['modo_dashboard_fiscal', '1', 'boolean', 'Modo fiscal ativo por padrão (F12) — ERP e PDV'],
  ['equipamentos_ativo', 'true', 'boolean', 'Motor de Equipamentos habilitado']
];

function obterSenhaSuperAdminPadrao() {
  return process.env.ADMIN_SEED_PASSWORD || SUPER_ADMIN_PASSWORD_PADRAO;
}

function hashSenhaBootstrap(senhaPlain) {
  return bcrypt.hashSync(String(senhaPlain), BCRYPT_ROUNDS);
}

function compararSenhaBootstrap(senhaPlain, hash) {
  if (!hash || typeof hash !== 'string') return false;
  try {
    return bcrypt.compareSync(String(senhaPlain), hash);
  } catch {
    return false;
  }
}

function hashPareceBcrypt(hash) {
  return typeof hash === 'string' && /^\$2[aby]\$\d{2}\$/.test(hash);
}

function dbRun(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function dbGet(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row || null);
    });
  });
}

function dbAll(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function garantirTabelasCriticas(db) {
  await dbRun(
    db,
    `CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave VARCHAR(100) UNIQUE NOT NULL,
      valor TEXT,
      tipo VARCHAR(50),
      descricao TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await dbRun(
    db,
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(100) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'operador',
      nome TEXT,
      perfil TEXT DEFAULT 'USUARIO',
      pode_alterar_senhas INTEGER DEFAULT 0,
      ativo INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await dbRun(
    db,
    `CREATE TABLE IF NOT EXISTS usuario_permissoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER NOT NULL,
      permissao TEXT NOT NULL,
      permitido INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(usuario_id, permissao),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    )`
  );

  await dbRun(
    db,
    `CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_id INTEGER,
      usuario_nome TEXT,
      modulo TEXT,
      acao TEXT NOT NULL,
      referencia_tipo TEXT,
      referencia_id INTEGER,
      detalhes TEXT,
      ip_requisicao TEXT,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    )`
  );

  const colunasUsuarios = [
    ['ativo', 'INTEGER DEFAULT 1'],
    ['nome', 'TEXT'],
    ['perfil', "TEXT DEFAULT 'USUARIO'"],
    ['pode_alterar_senhas', 'INTEGER DEFAULT 0']
  ];

  for (const [coluna, definicao] of colunasUsuarios) {
    try {
      await dbRun(db, `ALTER TABLE usuarios ADD COLUMN ${coluna} ${definicao}`);
    } catch (err) {
      const msg = err?.message || '';
      if (!msg.includes('duplicate column') && !msg.includes('already exists')) {
        throw err;
      }
    }
  }
}

async function verificarTabelasObrigatorias(db) {
  const ausentes = [];
  for (const tabela of TABELAS_OBRIGATORIAS) {
    const row = await dbGet(
      db,
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
      [tabela]
    );
    if (!row) ausentes.push(tabela);
  }

  if (ausentes.length > 0) {
    throw new Error(
      `[BOOTSTRAP] Tabelas obrigatórias ausentes: ${ausentes.join(', ')}`
    );
  }
}

async function garantirConfiguracoesPadrao(db) {
  const contagem = await dbGet(db, 'SELECT COUNT(*) AS total FROM configuracoes');
  const vazia = !contagem || Number(contagem.total || 0) === 0;

  for (const config of CONFIGURACOES_PADRAO) {
    await dbRun(
      db,
      `INSERT OR IGNORE INTO configuracoes (chave, valor, tipo, descricao) VALUES (?, ?, ?, ?)`,
      config
    );
  }

  console.log('[BOOTSTRAP] Configurações criadas.');
  return { criadaDeVazio: vazia };
}

async function garantirSuperAdmin(db) {
  const contagem = await dbGet(db, 'SELECT COUNT(*) AS total FROM usuarios');
  const total = Number(contagem?.total || 0);
  const senhaPadrao = obterSenhaSuperAdminPadrao();

  if (total === 0) {
    const hash = hashSenhaBootstrap(senhaPadrao);
    await dbRun(
      db,
      `INSERT INTO usuarios (
        username, password_hash, role, nome, perfil, pode_alterar_senhas, ativo
      ) VALUES (?, ?, 'admin', ?, 'SUPER_ADMIN', 1, 1)`,
      [SUPER_ADMIN_USERNAME, hash, SUPER_ADMIN_NOME]
    );
    console.log('[BOOTSTRAP] SUPER_ADMIN criado.');
    return { criado: true };
  }

  const diego = await dbGet(
    db,
    `SELECT id, username, password_hash, perfil, ativo FROM usuarios WHERE username = ?`,
    [SUPER_ADMIN_USERNAME]
  );

  if (diego) {
    await dbRun(
      db,
      `UPDATE usuarios
       SET perfil = 'SUPER_ADMIN',
           pode_alterar_senhas = 1,
           nome = ?,
           role = 'admin',
           ativo = 1
       WHERE id = ?`,
      [SUPER_ADMIN_NOME, diego.id]
    );

    if (!hashPareceBcrypt(diego.password_hash)) {
      const hash = hashSenhaBootstrap(senhaPadrao);
      await dbRun(db, `UPDATE usuarios SET password_hash = ? WHERE id = ?`, [hash, diego.id]);
      console.log('[BOOTSTRAP] SUPER_ADMIN hash reparado (ausente/inválido).');
    }

    console.log('[BOOTSTRAP] SUPER_ADMIN já existente.');
    return { criado: false };
  }

  console.log('[BOOTSTRAP] SUPER_ADMIN já existente.');
  return { criado: false };
}

/**
 * Repara o hash do SUPER_ADMIN padrão quando o login falha por hash ausente/inválido
 * e a senha informada é a senha padrão de instalação.
 *
 * @returns {Promise<{reparado: boolean, usuario?: object}>}
 */
async function repararHashSuperAdminSeNecessario(db, username, passwordPlain) {
  if (String(username || '') !== SUPER_ADMIN_USERNAME) {
    return { reparado: false };
  }
  if (String(passwordPlain || '') !== obterSenhaSuperAdminPadrao()) {
    return { reparado: false };
  }

  const usuario = await dbGet(
    db,
    `SELECT * FROM usuarios WHERE username = ? AND COALESCE(ativo, 1) = 1`,
    [SUPER_ADMIN_USERNAME]
  );
  if (!usuario) return { reparado: false };

  // Somente se hash estiver ausente ou não for bcrypt válido (primeira instalação / DB corrompido).
  if (hashPareceBcrypt(usuario.password_hash)) {
    return { reparado: false, usuario };
  }

  const novoHash = hashSenhaBootstrap(passwordPlain);
  await dbRun(db, `UPDATE usuarios SET password_hash = ? WHERE id = ?`, [
    novoHash,
    usuario.id
  ]);
  usuario.password_hash = novoHash;
  console.log('[BOOTSTRAP] SUPER_ADMIN password_hash regenerado no login.');
  return { reparado: true, usuario };
}

/**
 * @param {import('sqlite3').Database} db
 * @param {{ migrationsJaExecutadas?: boolean }} [opcoes]
 */
async function executarBootstrap(db, opcoes = {}) {
  console.log('[BOOTSTRAP] Banco inicializado.');

  await garantirTabelasCriticas(db);

  if (!opcoes.migrationsJaExecutadas) {
    const { aplicarMigrationsMotorComercial } = require('../motores/motor-comercial/migrations');
    await aplicarMigrationsMotorComercial(db);
  }
  console.log('[BOOTSTRAP] Migrations executadas.');

  await verificarTabelasObrigatorias(db);
  await garantirConfiguracoesPadrao(db);
  await garantirSuperAdmin(db);

  return { ok: true };
}

module.exports = {
  executarBootstrap,
  garantirTabelasCriticas,
  garantirConfiguracoesPadrao,
  garantirSuperAdmin,
  verificarTabelasObrigatorias,
  repararHashSuperAdminSeNecessario,
  obterSenhaSuperAdminPadrao,
  hashSenhaBootstrap,
  compararSenhaBootstrap,
  hashPareceBcrypt,
  CONFIGURACOES_PADRAO,
  TABELAS_OBRIGATORIAS,
  SUPER_ADMIN_USERNAME,
  SUPER_ADMIN_NOME,
  SUPER_ADMIN_PASSWORD_PADRAO,
  BCRYPT_ROUNDS
};
