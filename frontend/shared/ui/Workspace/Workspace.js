/**
 * Workspace — Shared UI (FOUNDATION F2 / DS-001 / ADR-UX-001)
 *
 * Layout obrigatório de Estação/Central:
 * Header fixo + Body com scroll interno + Footer fixo.
 * Sem regras de negócio. Sem dependência de motores.
 *
 * Composição:
 *   Workspace.create({ header, body, footer, variant })
 *   Workspace.Header.create(...)
 *   Workspace.Body.create(...)
 *   Workspace.Footer.create(...)
 *
 * @module frontend/shared/ui/Workspace/Workspace
 */

const WorkspaceHeader = require('./WorkspaceHeader');
const WorkspaceBody = require('./WorkspaceBody');
const WorkspaceFooter = require('./WorkspaceFooter');

const STATUS = 'ready';
const STYLE_ID = 'cds-shared-ui-workspace-styles';

const VARIANTS = Object.freeze(['station', 'central']);

/**
 * @param {Object} [options]
 * @param {'station'|'central'} [options.variant='station']
 * @param {HTMLElement|Object} [options.header] - elemento ou opções de WorkspaceHeader
 * @param {HTMLElement|Object|string} [options.body] - elemento, opções de Body, ou children
 * @param {HTMLElement|Object} [options.footer] - elemento ou opções de WorkspaceFooter
 * @param {string} [options.className]
 * @param {boolean} [options.injectStyles=true]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  const {
    variant = 'station',
    header = null,
    body = null,
    footer = null,
    className = '',
    injectStyles = true
  } = options;

  if (injectStyles) {
    ensureStyles();
  }

  const safeVariant = VARIANTS.includes(variant) ? variant : 'station';

  const root = document.createElement('div');
  root.className = [
    'cds-workspace',
    `cds-workspace--${safeVariant}`,
    className
  ].filter(Boolean).join(' ');
  root.dataset.sharedUi = 'Workspace';
  root.dataset.variant = safeVariant;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-label', safeVariant === 'central' ? 'Central' : 'Estação de trabalho');

  const headerEl = resolveHeader(header);
  const bodyEl = resolveBody(body);
  const footerEl = resolveFooter(footer);

  if (headerEl) root.appendChild(headerEl);
  root.appendChild(bodyEl || WorkspaceBody.create({ children: null }));
  if (footerEl) root.appendChild(footerEl);

  const titleEl = root.querySelector('.cds-workspace__title');
  if (titleEl?.id) {
    root.setAttribute('aria-labelledby', titleEl.id);
  }

  return root;
}

function resolveHeader(header) {
  if (!header) return null;
  if (header.nodeType === 1) return header;
  if (typeof header === 'object') return WorkspaceHeader.create(header);
  return null;
}

function resolveBody(body) {
  if (!body) return WorkspaceBody.create({ children: null });
  if (body.nodeType === 1) {
    if (body.classList?.contains('cds-workspace__body')) return body;
    return WorkspaceBody.create({ children: body });
  }
  if (typeof body === 'object' && (body.children != null || body.scroll != null || body.className != null)) {
    return WorkspaceBody.create(body);
  }
  return WorkspaceBody.create({ children: body });
}

function resolveFooter(footer) {
  if (!footer) return null;
  if (footer.nodeType === 1) return footer;
  if (typeof footer === 'object') return WorkspaceFooter.create(footer);
  return null;
}

/**
 * Monta/recompõe slots em um Workspace já criado.
 * @param {HTMLElement} root
 * @param {{ header?: HTMLElement|Object|null, body?: HTMLElement|Object|null, footer?: HTMLElement|Object|null }} slots
 */
function compose(root, slots = {}) {
  if (!root) return root;

  if ('header' in slots) {
    const existing = root.querySelector(':scope > .cds-workspace__header');
    const next = resolveHeader(slots.header);
    if (existing) existing.remove();
    if (next) root.insertBefore(next, root.firstChild);
  }

  if ('body' in slots) {
    const existing = root.querySelector(':scope > .cds-workspace__body');
    const next = resolveBody(slots.body);
    if (existing) existing.replaceWith(next);
    else if (next) {
      const footer = root.querySelector(':scope > .cds-workspace__footer');
      if (footer) root.insertBefore(next, footer);
      else root.appendChild(next);
    }
  }

  if ('footer' in slots) {
    const existing = root.querySelector(':scope > .cds-workspace__footer');
    const next = resolveFooter(slots.footer);
    if (existing) existing.remove();
    if (next) root.appendChild(next);
  }

  return root;
}

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = getStyles();
  document.head.appendChild(style);
}

/**
 * CSS oficial do Workspace (desktop-first).
 * Também disponível em styles.css para bundlers.
 * @returns {string}
 */
function getStyles() {
  return `
.cds-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  background: var(--color-bg, #f8fafc);
  color: var(--color-text, #0f172a);
}

.cds-workspace *,
.cds-workspace *::before,
.cds-workspace *::after {
  box-sizing: border-box;
}

.cds-workspace__header {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--color-surface, #ffffff);
  border-bottom: 1px solid var(--color-neutral-200, #e2e8f0);
  z-index: 2;
}

.cds-workspace__breadcrumb {
  font-size: 0.75rem;
  color: var(--color-neutral-600, #475569);
}

.cds-workspace__header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.cds-workspace__back {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 1.125rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
  color: inherit;
}

.cds-workspace__titles {
  flex: 1 1 auto;
  min-width: 0;
}

.cds-workspace__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.3;
}

.cds-workspace__subtitle {
  margin: 0.15rem 0 0;
  font-size: 0.875rem;
  color: var(--color-neutral-600, #475569);
}

.cds-workspace__header-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex: 0 1 auto;
}

.cds-workspace__status,
.cds-workspace__operator,
.cds-workspace__updated-at {
  font-size: 0.8125rem;
  color: var(--color-neutral-700, #334155);
}

.cds-workspace__header-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.cds-workspace__context {
  font-size: 0.8125rem;
  color: var(--color-neutral-700, #334155);
}

.cds-workspace__body {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  padding: 1rem 1.25rem;
}

.cds-workspace__body--scroll {
  overflow-x: hidden;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.cds-workspace__body--clip {
  overflow: hidden;
}

.cds-workspace__footer {
  flex: 0 0 auto;
  padding: 0.75rem 1.25rem;
  background: var(--color-surface, #ffffff);
  border-top: 1px solid var(--color-neutral-200, #e2e8f0);
  z-index: 2;
}

.cds-workspace__footer[data-busy="true"] {
  opacity: 0.85;
  pointer-events: none;
}

.cds-workspace__footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.cds-workspace__footer-left,
.cds-workspace__footer-right,
.cds-workspace__footer-slot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cds-workspace__footer-right {
  margin-left: auto;
  justify-content: flex-end;
}

.cds-workspace__footer-slot {
  width: 100%;
  justify-content: space-between;
}

/* Desktop-first: resoluções oficiais 1366 / 1600 / 1920 */
@media (max-width: 1365px) {
  .cds-workspace__header,
  .cds-workspace__body,
  .cds-workspace__footer {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
  }

  .cds-workspace__header-top {
    flex-direction: column;
    align-items: stretch;
  }

  .cds-workspace__header-meta {
    justify-content: flex-start;
  }
}

@media (min-width: 1600px) {
  .cds-workspace__title {
    font-size: 1.375rem;
  }
}

@media (min-width: 1920px) {
  .cds-workspace__header,
  .cds-workspace__body,
  .cds-workspace__footer {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
`.trim();
}

const Workspace = {
  STATUS,
  NAME: 'Workspace',
  VARIANTS,
  create,
  compose,
  ensureStyles,
  getStyles,
  Header: WorkspaceHeader,
  Body: WorkspaceBody,
  Footer: WorkspaceFooter
};

module.exports = Workspace;
