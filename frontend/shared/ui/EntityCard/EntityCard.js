/**
 * EntityCard — Shared UI (FOUNDATION F3 / DS-001 §5.9)
 *
 * Cartão universal de entidade da Plataforma CDS.
 * Não possui layout ou campos específicos de nenhum motor.
 *
 * @module frontend/shared/ui/EntityCard/EntityCard
 */

const STATUS = 'ready';
const STYLE_ID = 'cds-shared-ui-entitycard-styles';

const STATES = Object.freeze([
  'normal',
  'selected',
  'disabled',
  'loading',
  'error'
]);

/** Variantes oficiais de densidade (UX-21.2) */
const VARIANTS = Object.freeze(['compact', 'normal', 'detailed']);

/**
 * @param {Object} [options]
 * @param {string} [options.title]
 * @param {string} [options.subtitle]
 * @param {string} [options.description]
 * @param {Array<{label?:string,value?:string}|string|HTMLElement>|Object} [options.metadata]
 * @param {string|HTMLElement} [options.status]
 * @param {Array<string|{text:string,variant?:string}>} [options.badges]
 * @param {{ primary?: ActionSpec, secondary?: ActionSpec }|ActionSpec[]} [options.actions]
 * @param {ActionSpec} [options.primaryAction] alias
 * @param {ActionSpec} [options.secondaryAction] alias
 * @param {boolean} [options.selected]
 * @param {boolean} [options.disabled]
 * @param {boolean} [options.loading]
 * @param {boolean|string} [options.error]
 * @param {Function} [options.onSelect]
 * @param {Function} [options.onPrimaryAction]
 * @param {Function} [options.onSecondaryAction]
 * @param {string} [options.kind] free-form CSS hook (nunca enum de domínio)
 * @param {'compact'|'normal'|'detailed'} [options.variant='normal']
 * @param {boolean} [options.compact] alias legado → variant compact
 * @param {string} [options.className]
 * @param {boolean} [options.injectStyles=true]
 * @returns {HTMLElement}
 *
 * @typedef {Object} ActionSpec
 * @property {string} [label]
 * @property {string} [variant]
 * @property {Function} [onClick]
 * @property {boolean} [disabled]
 */
function create(options = {}) {
  if (options.injectStyles !== false) {
    ensureStyles();
  }

  const title = options.title != null ? String(options.title) : '';
  const subtitle = options.subtitle != null ? String(options.subtitle) : '';
  const description = options.description != null ? String(options.description) : '';
  const selected = Boolean(options.selected);
  const disabled = Boolean(options.disabled);
  const loading = Boolean(options.loading);
  const error = options.error;
  const density = resolveVariant(options);
  const kind = options.kind ? String(options.kind) : '';

  const actions = normalizeActions(options);

  let mode = 'normal';
  if (disabled) mode = 'disabled';
  else if (loading) mode = 'loading';
  else if (error) mode = 'error';
  else if (selected) mode = 'selected';

  const root = document.createElement('article');
  root.className = [
    'cds-entity-card',
    `cds-entity-card--${density}`,
    `cds-entity-card--${mode}`,
    options.className || ''
  ].filter(Boolean).join(' ');
  root.dataset.sharedUi = 'EntityCard';
  root.dataset.state = mode;
  root.dataset.variant = density;
  if (kind) root.dataset.kind = kind;
  root.setAttribute('aria-disabled', disabled || loading ? 'true' : 'false');
  if (selected) root.setAttribute('aria-current', 'true');

  if (typeof options.onSelect === 'function' && !disabled && !loading) {
    root.tabIndex = 0;
    root.setAttribute('role', 'button');
    root.addEventListener('click', (e) => {
      if (e.target.closest('.cds-entity-card__actions')) return;
      options.onSelect({ title, subtitle, description, metadata: options.metadata });
    });
    root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.cds-entity-card__actions')) return;
        e.preventDefault();
        options.onSelect({ title, subtitle, description, metadata: options.metadata });
      }
    });
  }

  const head = document.createElement('div');
  head.className = 'cds-entity-card__head';

  const titles = document.createElement('div');
  titles.className = 'cds-entity-card__titles';

  const h = document.createElement('h3');
  h.className = 'cds-entity-card__title';
  h.textContent = title || (loading ? 'Carregando…' : '—');
  titles.appendChild(h);

  if (subtitle) {
    const sub = document.createElement('p');
    sub.className = 'cds-entity-card__subtitle';
    sub.textContent = subtitle;
    titles.appendChild(sub);
  }

  if (description) {
    const desc = document.createElement('p');
    desc.className = density === 'compact'
      ? 'cds-entity-card__description cds-entity-card__summary'
      : 'cds-entity-card__description';
    desc.textContent = description;
    titles.appendChild(desc);
  }

  head.appendChild(titles);

  const metaRight = document.createElement('div');
  metaRight.className = 'cds-entity-card__meta-right';

  if (options.status != null && options.status !== '') {
    const statusWrap = document.createElement('div');
    statusWrap.className = 'cds-entity-card__status';
    if (typeof options.status === 'string') {
      statusWrap.textContent = options.status;
    } else {
      statusWrap.appendChild(options.status);
    }
    metaRight.appendChild(statusWrap);
  }

  if (Array.isArray(options.badges) && options.badges.length) {
    const badges = document.createElement('div');
    badges.className = 'cds-entity-card__badges';
    options.badges.forEach((b) => {
      const badge = document.createElement('span');
      badge.className = 'cds-entity-card__badge';
      if (typeof b === 'string') {
        badge.textContent = b;
      } else {
        badge.textContent = b.text || b.label || '';
        if (b.variant) badge.dataset.variant = b.variant;
      }
      badges.appendChild(badge);
    });
    metaRight.appendChild(badges);
  }

  if (metaRight.childNodes.length) head.appendChild(metaRight);
  root.appendChild(head);

  const metaNodes = normalizeMetadata(options.metadata);
  if (metaNodes.length) {
    const meta = document.createElement('dl');
    meta.className = 'cds-entity-card__metadata';
    metaNodes.forEach((item) => {
      if (item.nodeType === 1) {
        meta.appendChild(item);
        return;
      }
      const row = document.createElement('div');
      row.className = 'cds-entity-card__meta-row';
      if (item.label) {
        const dt = document.createElement('dt');
        dt.textContent = item.label;
        row.appendChild(dt);
      }
      const dd = document.createElement('dd');
      dd.textContent = item.value != null ? String(item.value) : '';
      row.appendChild(dd);
      meta.appendChild(row);
    });
    root.appendChild(meta);
  }

  if (error && typeof error === 'string') {
    const err = document.createElement('p');
    err.className = 'cds-entity-card__error';
    err.setAttribute('role', 'alert');
    err.textContent = error;
    root.appendChild(err);
  }

  if (loading) {
    const loader = document.createElement('div');
    loader.className = 'cds-entity-card__loading';
    loader.setAttribute('aria-hidden', 'true');
    loader.textContent = '…';
    root.appendChild(loader);
  }

  if (actions.primary || actions.secondary) {
    const actionsEl = document.createElement('div');
    actionsEl.className = 'cds-entity-card__actions';

    if (actions.secondary) {
      actionsEl.appendChild(buildActionButton(actions.secondary, 'secondary', () => {
        if (typeof options.onSecondaryAction === 'function') options.onSecondaryAction();
        if (typeof actions.secondary.onClick === 'function') actions.secondary.onClick();
      }, disabled || loading));
    }

    if (actions.primary) {
      actionsEl.appendChild(buildActionButton(actions.primary, 'primary', () => {
        if (typeof options.onPrimaryAction === 'function') options.onPrimaryAction();
        if (typeof actions.primary.onClick === 'function') actions.primary.onClick();
      }, disabled || loading || actions.primary.disabled));
    }

    root.appendChild(actionsEl);
  }

  root.cdsEntityCard = {
    setSelected(value) {
      root.classList.toggle('cds-entity-card--selected', Boolean(value));
      root.dataset.state = value ? 'selected' : (disabled ? 'disabled' : 'normal');
      if (value) root.setAttribute('aria-current', 'true');
      else root.removeAttribute('aria-current');
    },
    getState: () => root.dataset.state
  };

  return root;
}

function resolveVariant(options = {}) {
  if (options.variant && VARIANTS.includes(options.variant)) return options.variant;
  if (options.compact) return 'compact';
  return 'normal';
}

function normalizeActions(options) {
  const out = { primary: null, secondary: null };
  if (options.actions && !Array.isArray(options.actions)) {
    out.primary = options.actions.primary || null;
    out.secondary = options.actions.secondary || null;
  } else if (Array.isArray(options.actions)) {
    out.primary = options.actions[0] || null;
    out.secondary = options.actions[1] || null;
  }
  if (options.primaryAction) out.primary = options.primaryAction;
  if (options.secondaryAction) out.secondary = options.secondaryAction;
  return out;
}

function normalizeMetadata(metadata) {
  if (!metadata) return [];
  if (Array.isArray(metadata)) {
    return metadata.map((item) => {
      if (item == null) return null;
      if (typeof item === 'string') return { label: '', value: item };
      if (item.nodeType === 1) return item;
      return { label: item.label || item.key || '', value: item.value != null ? item.value : item.text };
    }).filter(Boolean);
  }
  if (typeof metadata === 'object') {
    return Object.keys(metadata).map((key) => ({ label: key, value: metadata[key] }));
  }
  return [];
}

function buildActionButton(spec, kind, onClick, disabled) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = [
    'cds-entity-card__action',
    `cds-entity-card__action--${kind}`,
    spec.variant ? `cds-entity-card__action--${spec.variant}` : ''
  ].filter(Boolean).join(' ');
  btn.textContent = spec.label || (kind === 'primary' ? 'Abrir' : 'Mais');
  btn.disabled = Boolean(disabled);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!btn.disabled) onClick();
  });
  return btn;
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
.cds-entity-card {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1rem;
  background: var(--color-surface, #ffffff);
  border: 1px solid var(--color-neutral-200, #e2e8f0);
  border-radius: 16px;
  color: var(--color-text, #0f172a);
  box-sizing: border-box;
  width: 100%;
  font-family: inherit;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.cds-entity-card *,
.cds-entity-card *::before,
.cds-entity-card *::after { box-sizing: border-box; }

/* —— Variante compact (Centrais / densidade operacional UX-21.3) —— */
.cds-entity-card--compact {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  min-height: 0;
  max-height: none;
  padding: 12px 14px;
  gap: 6px;
  border-radius: 14px;
}

.cds-entity-card--compact .cds-entity-card__head {
  width: 100%;
  gap: 0.5rem;
}

.cds-entity-card--compact .cds-entity-card__metadata {
  display: none;
}

.cds-entity-card--compact .cds-entity-card__actions {
  margin-top: 2px;
  justify-content: flex-end;
  align-self: stretch;
}

.cds-entity-card--compact .cds-entity-card__title {
  font-size: 0.9rem;
  line-height: 1.25;
}

.cds-entity-card--compact .cds-entity-card__subtitle {
  margin-top: 0.12rem;
  font-size: 0.75rem;
}

.cds-entity-card--compact .cds-entity-card__summary,
.cds-entity-card--compact .cds-entity-card__description {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-neutral-700, #334155);
  font-weight: 500;
}

.cds-entity-card--compact .cds-entity-card__status {
  font-size: 0.75rem;
  font-weight: 650;
}

.cds-entity-card--compact .cds-entity-card__badge {
  font-size: 0.625rem;
  letter-spacing: 0.04em;
}

.cds-entity-card--compact .cds-entity-card__action {
  min-height: 34px;
  min-width: 0;
  padding: 0.35rem 0.8rem;
  border-radius: 9px;
  white-space: nowrap;
  font-size: 0.8125rem;
}

/* —— Variante normal (padrão) —— */
.cds-entity-card--normal {
  padding: 1rem;
  gap: 0.65rem;
}

/* —— Variante detailed —— */
.cds-entity-card--detailed {
  padding: 1.25rem 1.35rem;
  gap: 0.85rem;
}

.cds-entity-card--detailed .cds-entity-card__title {
  font-size: 1.0625rem;
}

.cds-entity-card--detailed .cds-entity-card__metadata {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem 1.1rem;
}

.cds-entity-card[role="button"] {
  cursor: pointer;
}

.cds-entity-card[role="button"]:focus-visible,
.cds-entity-card__action:focus-visible {
  outline: 2px solid var(--color-primary, #2563eb);
  outline-offset: 2px;
}

.cds-entity-card--selected {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.18);
}

.cds-entity-card--disabled {
  opacity: 0.55;
  pointer-events: none;
}

.cds-entity-card--loading {
  position: relative;
}

.cds-entity-card--error {
  border-color: var(--color-error, #b91c1c);
}

.cds-entity-card__head {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
}

.cds-entity-card__titles { min-width: 0; flex: 1 1 auto; }

.cds-entity-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}

.cds-entity-card__subtitle,
.cds-entity-card__description {
  margin: 0.2rem 0 0;
  font-size: 0.8125rem;
  color: var(--color-neutral-600, #475569);
  line-height: 1.35;
}

.cds-entity-card__meta-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
  flex: 0 0 auto;
}

.cds-entity-card__status {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-neutral-700, #334155);
}

.cds-entity-card__badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  justify-content: flex-end;
}

.cds-entity-card__badge {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
  background: var(--color-neutral-100, #f1f5f9);
  color: var(--color-neutral-700, #334155);
}

.cds-entity-card__metadata {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.35rem 1rem;
  margin: 0;
}

.cds-entity-card__meta-row {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.cds-entity-card__meta-row dt {
  margin: 0;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--color-neutral-500, #64748b);
}

.cds-entity-card__meta-row dd {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cds-entity-card__error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-error, #b91c1c);
}

.cds-entity-card__loading {
  font-size: 1.25rem;
  color: var(--color-neutral-400, #94a3b8);
}

.cds-entity-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.15rem;
}

.cds-entity-card__action {
  min-height: 36px;
  padding: 0.35rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--color-neutral-300, #cbd5e1);
  background: var(--color-surface, #fff);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
}

.cds-entity-card__action--primary {
  background: var(--color-primary, #2563eb);
  border-color: var(--color-primary, #2563eb);
  color: #fff;
}

.cds-entity-card__action--secondary {
  background: transparent;
}

.cds-entity-card__action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 900px) {
  .cds-entity-card--compact .cds-entity-card__action {
    width: 100%;
  }
}

@media (max-width: 1366px) {
  .cds-entity-card--normal .cds-entity-card__metadata,
  .cds-entity-card--detailed .cds-entity-card__metadata {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1600px) {
  .cds-entity-card--normal,
  .cds-entity-card--detailed {
    padding-left: 1.15rem;
    padding-right: 1.15rem;
  }
}
`.trim();
}

module.exports = {
  STATUS,
  NAME: 'EntityCard',
  DS: 'EntityCard',
  STATES,
  VARIANTS,
  create,
  resolveVariant,
  getStyles,
  ensureStyles
};
