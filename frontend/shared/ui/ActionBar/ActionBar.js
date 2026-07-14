/**
 * ActionBar — Shared UI (FOUNDATION F2 / DS-001 §5.20)
 *
 * 1 primária · ≤ 2 secundárias · resto em “Mais”.
 * Sem regras de negócio. Sem dependência de motores.
 *
 * @module frontend/shared/ui/ActionBar/ActionBar
 */

const STATUS = 'ready';
const STYLE_ID = 'cds-shared-ui-actionbar-styles';
const MAX_SECONDARY = 2;

/**
 * @typedef {Object} ActionSpec
 * @property {string} [label]
 * @property {string} [variant]
 * @property {Function} [onClick]
 * @property {boolean} [disabled]
 * @property {string} [icon]
 */

/**
 * @param {Object} [options]
 * @param {ActionSpec} [options.primary]
 * @param {ActionSpec[]} [options.secondary]
 * @param {ActionSpec[]} [options.more]
 * @param {Function} [options.onPrimary]
 * @param {Function} [options.onSecondary]
 * @param {Function} [options.onMoreAction]
 * @param {string} [options.className]
 * @param {boolean} [options.injectStyles=true]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  if (options.injectStyles !== false) {
    ensureStyles();
  }

  const primary = options.primary || null;
  const secondary = Array.isArray(options.secondary) ? options.secondary.slice(0, MAX_SECONDARY) : [];
  const overflowSecondary = Array.isArray(options.secondary) ? options.secondary.slice(MAX_SECONDARY) : [];
  const more = [...overflowSecondary, ...(Array.isArray(options.more) ? options.more : [])];

  const root = document.createElement('div');
  root.className = ['cds-action-bar', options.className || ''].filter(Boolean).join(' ');
  root.dataset.sharedUi = 'ActionBar';
  root.setAttribute('role', 'toolbar');
  root.setAttribute('aria-label', 'Ações');

  const left = document.createElement('div');
  left.className = 'cds-action-bar__secondary';

  secondary.forEach((spec, index) => {
    left.appendChild(buildButton(spec, 'secondary', () => {
      if (typeof options.onSecondary === 'function') options.onSecondary(spec, index);
      if (typeof spec.onClick === 'function') spec.onClick();
    }));
  });

  if (more.length) {
    left.appendChild(buildMoreMenu(more, options.onMoreAction));
  }

  root.appendChild(left);

  const right = document.createElement('div');
  right.className = 'cds-action-bar__primary';

  if (primary) {
    right.appendChild(buildButton(primary, 'primary', () => {
      if (typeof options.onPrimary === 'function') options.onPrimary(primary);
      if (typeof primary.onClick === 'function') primary.onClick();
    }));
  }

  root.appendChild(right);

  root.cdsActionBar = {
    setPrimaryDisabled(disabled) {
      const btn = right.querySelector('.cds-action-bar__btn--primary');
      if (btn) btn.disabled = Boolean(disabled);
    }
  };

  return root;
}

function buildButton(spec, kind, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = [
    'cds-action-bar__btn',
    `cds-action-bar__btn--${kind}`,
    spec.variant ? `cds-action-bar__btn--${spec.variant}` : ''
  ].filter(Boolean).join(' ');
  const label = spec.label || (kind === 'primary' ? 'Continuar' : 'Ação');
  btn.textContent = spec.icon ? `${spec.icon} ${label}` : label;
  btn.disabled = Boolean(spec.disabled);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!btn.disabled) onClick();
  });
  return btn;
}

function buildMoreMenu(items, onMoreAction) {
  const wrap = document.createElement('div');
  wrap.className = 'cds-action-bar__more';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'cds-action-bar__btn cds-action-bar__btn--ghost';
  toggle.setAttribute('aria-haspopup', 'menu');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.textContent = 'Mais';

  const menu = document.createElement('div');
  menu.className = 'cds-action-bar__menu';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  items.forEach((spec) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'cds-action-bar__menu-item';
    item.setAttribute('role', 'menuitem');
    item.textContent = spec.icon ? `${spec.icon} ${spec.label || 'Ação'}` : (spec.label || 'Ação');
    item.disabled = Boolean(spec.disabled);
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
      if (typeof onMoreAction === 'function') onMoreAction(spec);
      if (typeof spec.onClick === 'function') spec.onClick();
    });
    menu.appendChild(item);
  });

  function closeMenu() {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  function openMenu() {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  document.addEventListener('click', function onDocClick(e) {
    if (!wrap.isConnected) {
      document.removeEventListener('click', onDocClick);
      return;
    }
    if (!wrap.contains(e.target)) closeMenu();
  });

  wrap.appendChild(toggle);
  wrap.appendChild(menu);
  return wrap;
}

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = getStyles();
  document.head.appendChild(style);
}

function getStyles() {
  return `
.cds-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
  box-sizing: border-box;
}

.cds-action-bar *,
.cds-action-bar *::before,
.cds-action-bar *::after { box-sizing: border-box; }

.cds-action-bar__secondary,
.cds-action-bar__primary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cds-action-bar__primary {
  margin-left: auto;
}

.cds-action-bar__btn {
  min-height: 40px;
  padding: 0.45rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--color-neutral-300, #cbd5e1);
  background: var(--color-surface, #fff);
  color: var(--color-text, #0f172a);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.cds-action-bar__btn:hover:not(:disabled) {
  border-color: var(--color-neutral-400, #94a3b8);
  transform: translateY(-1px);
}

.cds-action-bar__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cds-action-bar__btn--primary {
  background: var(--color-primary, #2563eb);
  border-color: var(--color-primary, #2563eb);
  color: #fff;
  min-width: 140px;
}

.cds-action-bar__btn--primary:hover:not(:disabled) {
  filter: brightness(1.05);
}

.cds-action-bar__btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--color-neutral-700, #334155);
}

.cds-action-bar__more {
  position: relative;
}

.cds-action-bar__menu {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  min-width: 180px;
  padding: 0.35rem;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-neutral-200, #e2e8f0);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  z-index: 20;
}

.cds-action-bar__menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.55rem 0.75rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: inherit;
  font-family: inherit;
}

.cds-action-bar__menu-item:hover:not(:disabled) {
  background: var(--color-neutral-100, #f1f5f9);
}

.cds-action-bar__menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .cds-action-bar {
    flex-wrap: wrap;
  }
  .cds-action-bar__primary {
    width: 100%;
  }
  .cds-action-bar__btn--primary {
    width: 100%;
  }
}
`.trim();
}

module.exports = {
  STATUS,
  NAME: 'ActionBar',
  DS: 'ActionBar',
  MAX_SECONDARY,
  create,
  ensureStyles,
  getStyles
};
