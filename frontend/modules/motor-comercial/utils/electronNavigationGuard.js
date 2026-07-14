/**
 * Guard de navegação pós-encerramento — elimina clique residual (Electron).
 *
 * @module frontend/modules/motor-comercial/utils/electronNavigationGuard
 */

const GUARD_KEY = 'cds-mc-nav-guard-until';
const GUARD_MS = 700;

function isElectronRuntime() {
  if (typeof navigator === 'undefined') return false;
  return /Electron/i.test(navigator.userAgent || '')
    || (typeof window !== 'undefined' && !!window.electronAPI);
}

/**
 * Instrumentação temporária — divergência Electron × Browser.
 * @param {Object} payload
 */
function logElectronFlow(payload = {}) {
  const line = {
    isElectron: isElectronRuntime(),
    ts: new Date().toISOString(),
    ...payload
  };
  console.log('========================');
  console.log('ELECTRON FLOW');
  console.log('========================');
  console.log('Tela atual:', line.tela || '-');
  console.log('Evento:', line.evento || '-');
  console.log('Origem:', line.origem || '-');
  console.log('Destino:', line.destino || '-');
  console.log('Recovery:', line.recovery || '-');
  console.log('Router:', line.router || '-');
  console.log('Checkpoint:', line.checkpoint || '-');
  console.log('Cliente:', line.cliente || '-');
  console.log('Operação:', line.operacao || '-');
  console.log('Payload:', line);
  console.log('========================');
}

function markCentralArrivalGuard(origem = '') {
  const until = Date.now() + GUARD_MS;
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(GUARD_KEY, String(until));
    }
  } catch (_error) {
    /* ignore */
  }
  logElectronFlow({
    evento: 'NAV_GUARD_SET',
    origem,
    destino: '/',
    operacao: `guard ${GUARD_MS}ms`
  });
}

function isCentralActionBlocked() {
  try {
    if (typeof sessionStorage === 'undefined') return false;
    const until = Number(sessionStorage.getItem(GUARD_KEY) || 0);
    if (!until) return false;
    if (Date.now() < until) {
      return true;
    }
    sessionStorage.removeItem(GUARD_KEY);
  } catch (_error) {
    return false;
  }
  return false;
}

function clearCentralArrivalGuard() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(GUARD_KEY);
    }
  } catch (_error) {
    /* ignore */
  }
}

module.exports = {
  GUARD_MS,
  isElectronRuntime,
  logElectronFlow,
  markCentralArrivalGuard,
  isCentralActionBlocked,
  clearCentralArrivalGuard
};
