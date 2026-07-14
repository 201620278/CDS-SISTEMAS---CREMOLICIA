/**
 * NotificationContext — arquitetura de notificações (Sprint O-8).
 *
 * Prepara toast, centro de notificações e badge no menu.
 * Push não implementado nesta sprint.
 *
 * @module frontend/modules/motor-comercial/contexts/NotificationContext
 */

let pendenciasCount = 0;
const listeners = new Set();

function getPendenciasCount() {
  return pendenciasCount;
}

function setPendenciasCount(count) {
  pendenciasCount = Number(count) || 0;
  listeners.forEach((fn) => {
    try { fn(pendenciasCount); } catch (_e) { /* noop */ }
  });
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function initFromWindow() {
  if (typeof window === 'undefined') return;
  window.MotorComercial = window.MotorComercial || {};
  if (window.MotorComercial.pendenciasCount != null) {
    setPendenciasCount(window.MotorComercial.pendenciasCount);
  }
  window.addEventListener('motor-comercial:pendencias-updated', (event) => {
    setPendenciasCount(event.detail?.count ?? 0);
  });
}

initFromWindow();

module.exports = {
  getPendenciasCount,
  setPendenciasCount,
  subscribe
};
