/**
 * SmartSearch — Shared UI (FOUNDATION F3 / DS-001 §5.8)
 *
 * Omnisearch genérico da Plataforma CDS.
 * Não conhece domínio (cliente, produto, consignado…).
 * A origem dos dados é exclusiva do `provider`.
 *
 * @module frontend/shared/ui/SmartSearch/SmartSearch
 */

const { debounce, announce } = require('../Utils');

function loadEntityCard() {
  try {
    return require('../EntityCard');
  } catch (_e) {
    return null;
  }
}

const STATUS = 'ready';
const STYLE_ID = 'cds-shared-ui-smartsearch-styles';

const STATES = Object.freeze([
  'idle',
  'searching',
  'loading',
  'results',
  'empty',
  'error',
  'disabled'
]);

/**
 * @typedef {Object} SearchResult
 * @property {string|number} [id]
 * @property {string} [title]
 * @property {string} [label]
 * @property {string} [subtitle]
 * @property {string} [description]
 * @property {string|HTMLElement} [status]
 * @property {Array<string|Object>} [badges]
 * @property {Array|Object} [metadata]
 * @property {*} [data] opaque payload for the consumer
 */

/**
 * @param {Object} [options]
 * @param {string} [options.placeholder]
 * @param {Function} [options.provider] async (query, ctx) => SearchResult[] | { items }
 * @param {Function} [options.onSelect]
 * @param {Function} [options.onQuery]
 * @param {Function} [options.onClear]
 * @param {Function} [options.onStateChange]
 * @param {number} [options.debounce=250]
 * @param {number} [options.minChars=1]
 * @param {Object|boolean} [options.shortcuts] { focus: true } — Ctrl+F
 * @param {*} [options.filters] opaque, forwarded to provider
 * @param {string[]} [options.keys] additional search keys hint for provider
 * @param {boolean} [options.disabled]
 * @param {Function} [options.renderResult] (item, index, helpers) => HTMLElement
 * @param {boolean} [options.useEntityCard=true]
 * @param {string} [options.emptyMessage]
 * @param {string} [options.className]
 * @param {boolean} [options.injectStyles=true]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  if (options.injectStyles !== false) {
    ensureStyles();
  }

  const cfg = {
    placeholder: options.placeholder || 'Pesquisar…',
    provider: typeof options.provider === 'function' ? options.provider : null,
    onSelect: typeof options.onSelect === 'function' ? options.onSelect : null,
    onQuery: typeof options.onQuery === 'function' ? options.onQuery : null,
    onClear: typeof options.onClear === 'function' ? options.onClear : null,
    onStateChange: typeof options.onStateChange === 'function' ? options.onStateChange : null,
    debounceMs: Number.isFinite(options.debounce) ? options.debounce : 250,
    minChars: Number.isFinite(options.minChars) ? Math.max(0, options.minChars) : 1,
    shortcuts: normalizeShortcuts(options.shortcuts),
    filters: options.filters,
    keys: Array.isArray(options.keys) ? options.keys.slice() : [],
    disabled: Boolean(options.disabled),
    renderResult: typeof options.renderResult === 'function' ? options.renderResult : null,
    useEntityCard: options.useEntityCard !== false,
    emptyMessage: options.emptyMessage || 'Nenhum resultado',
    className: options.className || ''
  };

  const root = document.createElement('div');
  root.className = ['cds-smartsearch', cfg.className].filter(Boolean).join(' ');
  root.dataset.sharedUi = 'SmartSearch';
  root.setAttribute('role', 'search');

  const labelId = `cds-ss-label-${uid()}`;
  const listId = `cds-ss-list-${uid()}`;
  const statusId = `cds-ss-status-${uid()}`;

  const field = document.createElement('div');
  field.className = 'cds-smartsearch__field';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'cds-smartsearch__input';
  input.placeholder = cfg.placeholder;
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', listId);
  input.setAttribute('aria-labelledby', labelId);
  input.autocomplete = 'off';
  input.spellcheck = false;

  const srLabel = document.createElement('span');
  srLabel.id = labelId;
  srLabel.className = 'cds-smartsearch__sr-only';
  srLabel.textContent = cfg.placeholder;

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'cds-smartsearch__clear';
  clearBtn.setAttribute('aria-label', 'Limpar pesquisa');
  clearBtn.hidden = true;
  clearBtn.textContent = '×';

  field.appendChild(srLabel);
  field.appendChild(input);
  field.appendChild(clearBtn);

  const statusEl = document.createElement('div');
  statusEl.id = statusId;
  statusEl.className = 'cds-smartsearch__status';
  statusEl.setAttribute('role', 'status');
  statusEl.setAttribute('aria-live', 'polite');

  const list = document.createElement('ul');
  list.id = listId;
  list.className = 'cds-smartsearch__list';
  list.setAttribute('role', 'listbox');
  list.hidden = true;

  root.appendChild(field);
  root.appendChild(statusEl);
  root.appendChild(list);

  const state = {
    mode: cfg.disabled ? 'disabled' : 'idle',
    query: '',
    items: [],
    activeIndex: -1,
    error: null,
    abort: null
  };

  function setMode(mode, detail = {}) {
    if (!STATES.includes(mode)) return;
    state.mode = mode;
    root.dataset.state = mode;
    root.classList.toggle('cds-smartsearch--disabled', mode === 'disabled');
    input.disabled = mode === 'disabled';
    if (cfg.onStateChange) cfg.onStateChange(mode, { ...detail, query: state.query });
  }

  function setExpanded(open) {
    input.setAttribute('aria-expanded', open ? 'true' : 'false');
    list.hidden = !open;
  }

  function syncClearVisibility() {
    clearBtn.hidden = !state.query;
  }

  function setActiveIndex(index) {
    const max = state.items.length - 1;
    if (max < 0) {
      state.activeIndex = -1;
      input.removeAttribute('aria-activedescendant');
      list.querySelectorAll('[aria-selected="true"]').forEach((el) => el.setAttribute('aria-selected', 'false'));
      return;
    }
    state.activeIndex = Math.max(0, Math.min(index, max));
    const options = list.querySelectorAll('[role="option"]');
    options.forEach((el, i) => {
      const selected = i === state.activeIndex;
      el.setAttribute('aria-selected', selected ? 'true' : 'false');
      el.classList.toggle('cds-smartsearch__option--active', selected);
      if (selected) {
        input.setAttribute('aria-activedescendant', el.id);
        if (typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ block: 'nearest' });
        }
      }
    });
  }

  function normalizeItems(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.items)) return payload.items;
    return [];
  }

  function defaultRenderResult(item, index) {
    const EntityCard = loadEntityCard();
    if (cfg.useEntityCard && EntityCard && typeof EntityCard.create === 'function' && EntityCard.STATUS === 'ready') {
      const card = EntityCard.create({
        title: item.title || item.label || '—',
        subtitle: item.subtitle || item.document || '',
        description: item.description || '',
        metadata: item.metadata,
        status: item.status,
        badges: item.badges,
        selected: index === state.activeIndex,
        compact: true
      });
      card.id = `cds-ss-opt-${uid()}-${index}`;
      card.setAttribute('role', 'option');
      card.setAttribute('aria-selected', index === state.activeIndex ? 'true' : 'false');
      card.tabIndex = -1;
      card.removeAttribute('aria-disabled');
      return card;
    }

    const li = document.createElement('li');
    li.className = 'cds-smartsearch__option';
    li.id = `cds-ss-opt-${uid()}-${index}`;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.tabIndex = -1;

    const title = document.createElement('div');
    title.className = 'cds-smartsearch__option-title';
    title.innerHTML = highlight(item.title || item.label || '—', state.query);

    const sub = document.createElement('div');
    sub.className = 'cds-smartsearch__option-sub';
    sub.textContent = item.subtitle || item.description || '';

    li.appendChild(title);
    if (sub.textContent) li.appendChild(sub);
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      selectIndex(index);
    });
    return li;
  }

  function renderList() {
    list.innerHTML = '';
    state.items.forEach((item, index) => {
      const helpers = { query: state.query, highlight: (text) => highlight(text, state.query) };
      const node = cfg.renderResult
        ? cfg.renderResult(item, index, helpers)
        : defaultRenderResult(item, index);

      if (!node) return;
      if (node.getAttribute('role') !== 'option') {
        node.setAttribute('role', 'option');
      }
      if (!node.id) node.id = `cds-ss-opt-${uid()}-${index}`;
      node.addEventListener('mousedown', (e) => {
        e.preventDefault();
        selectIndex(index);
      });
      list.appendChild(node);
    });
    setActiveIndex(state.items.length ? 0 : -1);
  }

  function selectIndex(index) {
    if (index < 0 || index >= state.items.length) return;
    const item = state.items[index];
    if (cfg.onSelect) cfg.onSelect(item, { index, query: state.query });
    announce(`Selecionado: ${item.title || item.label || item.id || ''}`);
  }

  async function runSearch(query) {
    if (state.mode === 'disabled') return;

    if (state.abort) {
      try { state.abort.abort(); } catch (_e) { /* ignore */ }
    }

    const trimmed = String(query || '').trim();
    state.query = trimmed;
    syncClearVisibility();
    if (cfg.onQuery) cfg.onQuery(trimmed);

    if (!trimmed || trimmed.length < cfg.minChars) {
      state.items = [];
      state.error = null;
      list.innerHTML = '';
      setExpanded(false);
      statusEl.textContent = '';
      setMode('idle');
      return;
    }

    if (!cfg.provider) {
      state.items = [];
      setExpanded(false);
      statusEl.textContent = 'Provider não configurado';
      setMode('error', { message: 'Provider não configurado' });
      return;
    }

    setMode('loading');
    statusEl.textContent = 'Pesquisando…';
    setExpanded(true);

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    state.abort = controller;

    try {
      const payload = await cfg.provider(trimmed, {
        signal: controller ? controller.signal : undefined,
        filters: cfg.filters,
        keys: cfg.keys
      });

      if (controller && controller.signal.aborted) return;

      state.items = normalizeItems(payload);
      state.error = null;
      renderList();

      if (!state.items.length) {
        setMode('empty');
        statusEl.textContent = cfg.emptyMessage;
        list.innerHTML = '';
        const empty = document.createElement('li');
        empty.className = 'cds-smartsearch__empty';
        empty.setAttribute('role', 'presentation');
        empty.textContent = cfg.emptyMessage;
        list.appendChild(empty);
        setExpanded(true);
        announce(cfg.emptyMessage);
      } else {
        setMode('results');
        statusEl.textContent = `${state.items.length} resultado${state.items.length === 1 ? '' : 's'}`;
        setExpanded(true);
        announce(`${state.items.length} resultados`);
      }
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      state.error = err;
      state.items = [];
      list.innerHTML = '';
      const message = (err && err.message) || 'Erro na pesquisa';
      statusEl.textContent = message;
      setMode('error', { error: err });
      setExpanded(true);
      const li = document.createElement('li');
      li.className = 'cds-smartsearch__error';
      li.setAttribute('role', 'presentation');
      li.textContent = message;
      list.appendChild(li);
      announce(message, 'assertive');
    }
  }

  const runDebounced = (q) => {
    runSearch(q);
  };
  const scheduleSearch = cfg.debounceMs <= 0
    ? runDebounced
    : debounce(runDebounced, cfg.debounceMs);

  input.addEventListener('input', () => {
    if (state.mode === 'disabled') return;
    const q = input.value;
    state.query = q;
    syncClearVisibility();
    setMode(q.trim() ? 'searching' : 'idle');
    scheduleSearch(q);
  });

  input.addEventListener('keydown', (e) => {
    if (state.mode === 'disabled') return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (list.hidden && state.items.length) setExpanded(true);
      setActiveIndex(state.activeIndex < 0 ? 0 : state.activeIndex + 1);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(state.activeIndex <= 0 ? state.items.length - 1 : state.activeIndex - 1);
      return;
    }
    if (e.key === 'Enter') {
      if (state.activeIndex >= 0 && state.items.length) {
        e.preventDefault();
        selectIndex(state.activeIndex);
      }
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      clear();
    }
  });

  clearBtn.addEventListener('click', () => clear());

  function clear() {
    if (state.abort) {
      try { state.abort.abort(); } catch (_e) { /* ignore */ }
    }
    input.value = '';
    state.query = '';
    state.items = [];
    state.activeIndex = -1;
    state.error = null;
    list.innerHTML = '';
    statusEl.textContent = '';
    setExpanded(false);
    syncClearVisibility();
    setMode(cfg.disabled ? 'disabled' : 'idle');
    if (cfg.onClear) cfg.onClear();
    input.focus();
  }

  function focus() {
    if (state.mode === 'disabled') return;
    input.focus();
    input.select();
  }

  function setDisabled(disabled) {
    cfg.disabled = Boolean(disabled);
    if (cfg.disabled) {
      setMode('disabled');
      setExpanded(false);
    } else if (state.mode === 'disabled') {
      setMode(state.query ? 'searching' : 'idle');
    }
  }

  function destroy() {
    if (state.abort) {
      try { state.abort.abort(); } catch (_e) { /* ignore */ }
    }
    if (root._cdsShortcutHandler) {
      document.removeEventListener('keydown', root._cdsShortcutHandler, true);
      root._cdsShortcutHandler = null;
    }
    root.remove();
  }

  if (cfg.shortcuts.focus) {
    const handler = (e) => {
      if (!(e.ctrlKey || e.metaKey) || String(e.key).toLowerCase() !== 'f') return;
      if (!document.body.contains(root)) return;
      if (state.mode === 'disabled') return;
      e.preventDefault();
      focus();
    };
    root._cdsShortcutHandler = handler;
    document.addEventListener('keydown', handler, true);
  }

  setMode(cfg.disabled ? 'disabled' : 'idle');
  syncClearVisibility();

  root.cdsSmartSearch = {
    focus,
    clear,
    destroy,
    setDisabled,
    getQuery: () => state.query,
    getState: () => state.mode,
    getItems: () => state.items.slice(),
    searchNow: (q) => {
      if (q != null) input.value = q;
      return runSearch(input.value);
    },
    input,
    list
  };

  return root;
}

function normalizeShortcuts(shortcuts) {
  if (shortcuts === false) return { focus: false };
  if (shortcuts == null || shortcuts === true) return { focus: true };
  return { focus: shortcuts.focus !== false };
}

function highlight(text, query) {
  const safe = escapeHtml(String(text ?? ''));
  const q = String(query || '').trim();
  if (!q) return safe;
  try {
    const re = new RegExp(`(${escapeRegExp(q)})`, 'ig');
    return safe.replace(re, '<mark class="cds-smartsearch__mark">$1</mark>');
  } catch (_e) {
    return safe;
  }
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
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
.cds-smartsearch {
  position: relative;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  font-family: inherit;
  color: var(--color-text, #0f172a);
}

.cds-smartsearch *,
.cds-smartsearch *::before,
.cds-smartsearch *::after { box-sizing: border-box; }

.cds-smartsearch__sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border: 0;
}

.cds-smartsearch__field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-neutral-300, #cbd5e1);
  border-radius: 8px;
  padding: 0.35rem 0.65rem;
  min-height: 44px;
}

.cds-smartsearch__field:focus-within {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

.cds-smartsearch__input {
  flex: 1 1 auto;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 1rem;
  line-height: 1.4;
  color: inherit;
}

.cds-smartsearch__clear {
  flex: 0 0 auto;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--color-neutral-500, #64748b);
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
}

.cds-smartsearch__clear:focus-visible {
  outline: 2px solid var(--color-primary, #2563eb);
  outline-offset: 2px;
}

.cds-smartsearch__status {
  margin-top: 0.35rem;
  font-size: 0.75rem;
  color: var(--color-neutral-600, #475569);
  min-height: 1rem;
}

.cds-smartsearch__list {
  list-style: none;
  margin: 0.35rem 0 0;
  padding: 0.35rem;
  max-height: min(50vh, 360px);
  overflow-y: auto;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-neutral-200, #e2e8f0);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.cds-smartsearch__option {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.65rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
}

.cds-smartsearch__option:hover,
.cds-smartsearch__option--active,
.cds-smartsearch__option[aria-selected="true"] {
  background: var(--color-neutral-50, #f8fafc);
  border-color: var(--color-neutral-200, #e2e8f0);
}

.cds-smartsearch__option:focus-visible {
  outline: 2px solid var(--color-primary, #2563eb);
  outline-offset: 1px;
}

.cds-smartsearch__option-title {
  font-weight: 600;
  font-size: 0.9375rem;
}

.cds-smartsearch__option-sub {
  margin-top: 0.15rem;
  font-size: 0.8125rem;
  color: var(--color-neutral-600, #475569);
}

.cds-smartsearch__mark {
  background: #fef08a;
  color: inherit;
  padding: 0 0.1em;
  border-radius: 2px;
}

.cds-smartsearch__empty,
.cds-smartsearch__error {
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-neutral-600, #475569);
}

.cds-smartsearch__error { color: var(--color-error, #b91c1c); }

.cds-smartsearch--disabled {
  opacity: 0.55;
  pointer-events: none;
}

.cds-smartsearch .cds-entity-card {
  margin: 0;
}

@media (max-width: 1366px) {
  .cds-smartsearch__list { max-height: min(45vh, 320px); }
}
`.trim();
}

module.exports = {
  STATUS,
  NAME: 'SmartSearch',
  DS: 'SmartSearch',
  STATES,
  create,
  focus(root) {
    if (root && root.cdsSmartSearch) root.cdsSmartSearch.focus();
  },
  clear(root) {
    if (root && root.cdsSmartSearch) root.cdsSmartSearch.clear();
  },
  destroy(root) {
    if (root && root.cdsSmartSearch) root.cdsSmartSearch.destroy();
  },
  getStyles,
  ensureStyles
};
