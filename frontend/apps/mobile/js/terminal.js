/**
 * CDS Mobile RC1.1 — Terminal do Cliente Oficial
 * Persiste terminal_id no dispositivo e reutiliza o motor /api/terminais.
 */
import {
  CDS_MOBILE_VERSION,
  CDS_MOBILE_VERSION_LABEL
} from './version.js';

const KEYS = {
  id: 'cds_mobile_terminal_id',
  hostname: 'cds_mobile_terminal_hostname',
  nome: 'cds_mobile_terminal_nome',
  registered: 'cds_mobile_terminal_registered'
};

const HEARTBEAT_MS = 2 * 60 * 1000;
let heartbeatTimer = null;

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}') || {};
  } catch (e) {
    return {};
  }
}

function suggestedName() {
  const user = readUser();
  const first = String(user.nome || user.username || 'Mobile')
    .trim()
    .split(/\s+/)[0] || 'Mobile';
  return `CDS Mobile ${first}`;
}

function detectPlatform() {
  const ua = String(navigator.userAgent || '').toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobi|android|iphone/.test(ua)) return 'mobile';
  return 'web';
}

export function getStoredTerminal() {
  try {
    const id = Number(localStorage.getItem(KEYS.id));
    const hostname = localStorage.getItem(KEYS.hostname) || '';
    const nome = localStorage.getItem(KEYS.nome) || '';
    const registered = localStorage.getItem(KEYS.registered) === '1';
    return {
      id: Number.isInteger(id) && id > 0 ? id : null,
      hostname,
      nome,
      registered: registered && Number.isInteger(id) && id > 0
    };
  } catch (e) {
    return { id: null, hostname: '', nome: '', registered: false };
  }
}

export function isTerminalRegistered() {
  return getStoredTerminal().registered === true;
}

function persistTerminal(terminal) {
  if (!terminal || !terminal.id) return;
  try {
    localStorage.setItem(KEYS.id, String(terminal.id));
    localStorage.setItem(KEYS.hostname, String(terminal.hostname || ''));
    localStorage.setItem(KEYS.nome, String(terminal.nome || terminal.hostname || ''));
    localStorage.setItem(KEYS.registered, '1');
    window.terminalId = Number(terminal.id);
    window.__CDS_MOBILE_TERMINAL__ = {
      id: Number(terminal.id),
      hostname: terminal.hostname,
      nome: terminal.nome,
      cliente_tipo: 'mobile'
    };
  } catch (e) { /* ignore */ }
}

export function ensureHostname() {
  const stored = getStoredTerminal();
  if (stored.hostname) return stored.hostname;
  try {
    let host = localStorage.getItem(KEYS.hostname);
    if (!host) {
      host = `mobile-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(KEYS.hostname, host);
    }
    return host;
  } catch (e) {
    return `mobile-${Date.now().toString(36)}`;
  }
}

export function getClientHeaders() {
  const t = getStoredTerminal();
  const headers = {
    'X-CDS-Client': 'mobile',
    'X-CDS-Client-Version': CDS_MOBILE_VERSION,
    'X-CDS-Client-Platform': detectPlatform()
  };
  if (t.id) headers['X-Terminal-Id'] = String(t.id);
  return headers;
}

export function getTerminalRequestBody(body) {
  const next = Object.assign({}, body || {});
  const t = getStoredTerminal();
  if (t.id) next.terminal_id = t.id;
  return next;
}

export async function heartbeatTerminal(opts) {
  opts = opts || {};
  if (!window.CDSApi || typeof window.CDSApi.get !== 'function') {
    throw new Error('API indisponível');
  }
  const hostname = ensureHostname();
  const user = readUser();
  const nome = String(opts.nome || getStoredTerminal().nome || suggestedName()).trim();

  const terminal = await window.CDSApi.get('terminais/auto', {
    hostname,
    origem: 'mobile',
    cliente_tipo: 'mobile',
    nome,
    versao: CDS_MOBILE_VERSION,
    plataforma: detectPlatform(),
    usuario_id: user.id || user.usuario_id || undefined,
    usuario_nome: user.nome || user.username || undefined
  });

  persistTerminal(terminal);
  return terminal;
}

export async function registerTerminal(nome) {
  const label = String(nome || suggestedName()).trim();
  if (!label) throw new Error('Informe um nome para o terminal.');
  try {
    localStorage.setItem(KEYS.nome, label);
  } catch (e) { /* ignore */ }
  const terminal = await heartbeatTerminal({ nome: label });
  startHeartbeat();
  return terminal;
}

export function startHeartbeat() {
  if (heartbeatTimer) return;
  if (!isTerminalRegistered()) return;
  heartbeatTimer = setInterval(() => {
    heartbeatTerminal().catch(() => {});
  }, HEARTBEAT_MS);
  heartbeatTerminal().catch(() => {});
}

export function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export async function disconnectTerminal() {
  const t = getStoredTerminal();
  stopHeartbeat();
  if (!t.hostname || !window.CDSApi) return;
  try {
    await window.CDSApi.get('terminais/auto/offline', {
      hostname: t.hostname,
      origem: 'mobile'
    });
  } catch (e) { /* ignore */ }
}

export function clearTerminalLocal() {
  stopHeartbeat();
  try {
    localStorage.removeItem(KEYS.id);
    localStorage.removeItem(KEYS.hostname);
    localStorage.removeItem(KEYS.nome);
    localStorage.removeItem(KEYS.registered);
  } catch (e) { /* ignore */ }
  window.terminalId = null;
  window.__CDS_MOBILE_TERMINAL__ = null;
}

export function getSuggestedTerminalName() {
  return suggestedName();
}

export function getClientMeta() {
  const t = getStoredTerminal();
  return {
    client_id: 'cds-mobile',
    client_type: 'mobile',
    client_label: CDS_MOBILE_VERSION_LABEL,
    version: CDS_MOBILE_VERSION,
    platform: detectPlatform(),
    terminal_id: t.id,
    terminal_nome: t.nome,
    hostname: t.hostname || ensureHostname()
  };
}

export default {
  getStoredTerminal,
  isTerminalRegistered,
  ensureHostname,
  getClientHeaders,
  getTerminalRequestBody,
  heartbeatTerminal,
  registerTerminal,
  startHeartbeat,
  stopHeartbeat,
  disconnectTerminal,
  clearTerminalLocal,
  getSuggestedTerminalName,
  getClientMeta
};
