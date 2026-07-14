/**
 * Utils — helpers operacionais Shared UI
 * STATUS: bridge/parcial
 */

function debounce(fn, waitMs = 250) {
  let timer = null;
  return function debounced(...args) {
    const ctx = this;
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(ctx, args), waitMs);
  };
}

function announce(message, politeness = 'polite') {
  if (typeof document === 'undefined') return;
  let live = document.getElementById('cds-shared-ui-live');
  if (!live) {
    live = document.createElement('div');
    live.id = 'cds-shared-ui-live';
    live.setAttribute('aria-live', politeness);
    live.setAttribute('role', 'status');
    live.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);';
    document.body.appendChild(live);
  }
  live.textContent = '';
  live.textContent = String(message || '');
}

module.exports = {
  STATUS: 'ready',
  NAME: 'Utils',
  debounce,
  announce
};
