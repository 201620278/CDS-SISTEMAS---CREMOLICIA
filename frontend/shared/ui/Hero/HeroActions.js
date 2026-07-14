/**
 * HeroActions — CTAs principais do Hero (Shared UI)
 * @module frontend/shared/ui/Hero/HeroActions
 */

/**
 * @typedef {Object} HeroAction
 * @property {string} label
 * @property {'primary'|'secondary'} [variant]
 * @property {Function} [onClick]
 * @property {boolean} [disabled]
 */

/**
 * @param {Object} [options]
 * @param {HeroAction[]} [options.actions]
 * @param {string} [options.className]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  const root = document.createElement('div');
  root.className = ['cds-hero__actions', options.className || ''].filter(Boolean).join(' ');
  root.dataset.sharedUi = 'HeroActions';
  root.setAttribute('role', 'group');
  root.setAttribute('aria-label', 'Ações principais');

  const actions = Array.isArray(options.actions) ? options.actions : [];
  actions.forEach((spec) => {
    if (!spec || !spec.label) return;
    const variant = spec.variant === 'secondary' ? 'secondary' : 'primary';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `cds-hero__action cds-hero__action--${variant}`;
    btn.textContent = String(spec.label);
    btn.disabled = Boolean(spec.disabled);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!btn.disabled && typeof spec.onClick === 'function') spec.onClick();
    });
    root.appendChild(btn);
  });

  return root;
}

module.exports = {
  NAME: 'HeroActions',
  create
};
