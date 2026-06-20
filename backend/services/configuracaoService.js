const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', '..', 'config', 'configuracoes.json');
const ELECTRON_CONFIG_PATH = path.join(__dirname, '..', '..', 'storage', 'config-servidor.json');

const DEFAULT = {
  tipoImplantacao: 'ERP_SEM_FISCAL',
  modoOperacao: 'LOCAL',
  ipServidor: '',
  porta: 3001
};

const TIPOS = ['ERP_SEM_FISCAL', 'ERP_FISCAL', 'ERP_MULTICAIXA'];
const MODOS = ['LOCAL', 'CLIENTE_SERVIDOR'];

function ensureConfigFile() {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT, null, 2), 'utf8');
  }
}

function normalizeConfig(obj) {
  return {
    tipoImplantacao: String(obj?.tipoImplantacao || DEFAULT.tipoImplantacao).toUpperCase(),
    modoOperacao: String(obj?.modoOperacao || DEFAULT.modoOperacao).toUpperCase(),
    ipServidor: String(obj?.ipServidor || '').trim(),
    porta: Number(obj?.porta || DEFAULT.porta)
  };
}

function readConfig() {
  try {
    ensureConfigFile();
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return Object.assign({}, DEFAULT, normalizeConfig(parsed));
  } catch (e) {
    console.error('Erro ao ler configuracoes.json:', e.message);
    return Object.assign({}, DEFAULT);
  }
}

function getRecursos(cfg) {
  const config = normalizeConfig(cfg || readConfig());
  const tipo = config.tipoImplantacao;
  const modo = config.modoOperacao;

  const recursos = {
    fiscal: false,
    nfce: false,
    nfe: false,
    nfse: false,
    multiCaixa: false,
    clienteServidor: false,
    terminaisPdv: false
  };

  if (tipo === 'ERP_FISCAL' || tipo === 'ERP_MULTICAIXA') {
    recursos.fiscal = true;
    recursos.nfce = true;
    recursos.nfe = true;
    recursos.nfse = true;
  }

  if (tipo === 'ERP_MULTICAIXA') {
    recursos.multiCaixa = true;
    recursos.clienteServidor = true;
    recursos.terminaisPdv = true;
  }

  if (tipo === 'ERP_FISCAL' && modo === 'CLIENTE_SERVIDOR') {
    recursos.clienteServidor = false;
  }

  return {
    tipoImplantacao: tipo,
    modoOperacao: modo,
    ipServidor: config.ipServidor,
    porta: config.porta,
    recursos
  };
}

function validateConfig(obj) {
  const errors = [];
  const config = normalizeConfig(obj);
  const { tipoImplantacao: tipo, modoOperacao: modo, ipServidor, porta } = config;

  if (!TIPOS.includes(tipo)) errors.push('tipoImplantacao inválido');
  if (!MODOS.includes(modo)) errors.push('modoOperacao inválido');

  if (!Number.isInteger(porta) || porta <= 0) errors.push('porta inválida');

  if (modo === 'CLIENTE_SERVIDOR' && !ipServidor) {
    errors.push('ipServidor obrigatório para modo CLIENTE_SERVIDOR');
  }

  if (tipo === 'ERP_FISCAL' && modo === 'CLIENTE_SERVIDOR') {
    errors.push('ERP Fiscal não suporta modo Cliente/Servidor');
  }

  if (modo === 'CLIENTE_SERVIDOR' && tipo !== 'ERP_MULTICAIXA') {
    errors.push('Modo Cliente/Servidor disponível apenas para ERP Multi-Caixa');
  }

  return { valid: errors.length === 0, errors, config };
}

function syncElectronConfig(cfg) {
  const config = normalizeConfig(cfg);
  const modoRede = getModoRedeElectron(config);
  const payload = modoRede.modo === 'cliente'
    ? { modo: 'cliente', ipServidor: modoRede.ipServidor, porta: modoRede.porta }
    : { modo: 'local', porta: modoRede.porta };

  const dir = path.dirname(ELECTRON_CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ELECTRON_CONFIG_PATH, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function getModoRedeElectron(cfg) {
  const config = normalizeConfig(cfg || readConfig());
  const recursos = getRecursos(config).recursos;

  if (config.modoOperacao === 'CLIENTE_SERVIDOR' && recursos.clienteServidor) {
    return {
      modo: 'cliente',
      ipServidor: config.ipServidor,
      porta: config.porta
    };
  }

  return {
    modo: 'local',
    ipServidor: '127.0.0.1',
    porta: config.porta || DEFAULT.porta
  };
}

function reloadGlobalConfig() {
  const cfg = readConfig();
  global.CONFIGURACAO_AVANCADA = cfg;
  global.CONFIGURACAO_RECURSOS = getRecursos(cfg);
  return cfg;
}

function saveConfig(obj) {
  const validation = validateConfig(obj);
  if (!validation.valid) {
    const error = new Error(validation.errors.join('; '));
    error.details = validation.errors;
    throw error;
  }

  const toSave = validation.config;
  ensureConfigFile();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(toSave, null, 2), 'utf8');
  syncElectronConfig(toSave);
  reloadGlobalConfig();
  return toSave;
}

function recursoHabilitado(nomeRecurso) {
  const recursos = getRecursos().recursos;
  return recursos[nomeRecurso] === true;
}

module.exports = {
  CONFIG_PATH,
  ELECTRON_CONFIG_PATH,
  DEFAULT,
  TIPOS,
  MODOS,
  readConfig,
  saveConfig,
  validateConfig,
  ensureConfigFile,
  getRecursos,
  getModoRedeElectron,
  syncElectronConfig,
  reloadGlobalConfig,
  recursoHabilitado
};
