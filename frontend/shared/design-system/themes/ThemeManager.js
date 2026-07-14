/**
 * CDS Design System — Theme Manager
 * Sprint UX/UI 2.0.1 — Fundação Visual Cremolícia
 * STAB-01.1 — Classic é o padrão do ERP; Dark/High Contrast só sob seleção explícita.
 *
 * Troca dinâmica de tema via atributo/classe no elemento raiz.
 * Sem reload. Persistência opcional em localStorage.
 *
 * @module frontend/shared/design-system/themes/ThemeManager
 */

const THEMES = Object.freeze({
  CLASSIC: 'classic',
  DARK: 'dark',
  HIGH_CONTRAST: 'high-contrast'
});

const THEME_LIST = Object.freeze([
  THEMES.CLASSIC,
  THEMES.DARK,
  THEMES.HIGH_CONTRAST
]);

/** Preferência de tema do ERP / Design System (não confundir com o login). */
const STORAGE_KEY = 'cds-ui-theme';
/** Migração STAB-01.1: remove Dark herdado do login (mesma chave antiga). */
const MIGRATION_KEY = 'cds-ui-theme-migrated-stab-01-1';
const DATA_ATTR = 'data-theme';
const CLASS_PREFIX = 'theme-';
const EVENT_NAME = 'cds:themechange';

function getRoot() {
  if (typeof document === 'undefined') return null;
  return document.documentElement;
}

function isValidTheme(theme) {
  return THEME_LIST.includes(theme);
}

function clearThemeClasses(root) {
  THEME_LIST.forEach((name) => {
    root.classList.remove(`${CLASS_PREFIX}${name}`);
  });
}

function readStoredTheme() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidTheme(stored) ? stored : null;
  } catch (_) {
    return null;
  }
}

/**
 * STAB-01.1 — Classic é o padrão.
 * Dark gravado antes desta correção (ex.: seletor do login na mesma chave)
 * não deve abrir o ERP escuro automaticamente.
 */
function runClassicDefaultMigration() {
  if (typeof localStorage === 'undefined') return;
  try {
    if (localStorage.getItem(MIGRATION_KEY) === '1') return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === THEMES.DARK) {
      localStorage.removeItem(STORAGE_KEY);
    }
    localStorage.setItem(MIGRATION_KEY, '1');
  } catch (_) {
    /* storage indisponível — ignora */
  }
}

/**
 * Aplica o tema no elemento raiz (html).
 * @param {string} theme
 * @param {{ persist?: boolean, root?: Element }} [options]
 * @returns {string} tema aplicado
 */
function setTheme(theme, options = {}) {
  const { persist = true, root = getRoot() } = options;
  const next = isValidTheme(theme) ? theme : THEMES.CLASSIC;

  if (!root) return next;

  root.setAttribute(DATA_ATTR, next);
  clearThemeClasses(root);
  root.classList.add(`${CLASS_PREFIX}${next}`);

  if (persist && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {
      /* storage indisponível — ignora */
    }
  }

  if (typeof document !== 'undefined') {
    document.dispatchEvent(
      new CustomEvent(EVENT_NAME, { detail: { theme: next } })
    );
  }

  return next;
}

/**
 * Lê o tema atual do DOM ou storage.
 * @returns {string}
 */
function getTheme() {
  const root = getRoot();
  if (root) {
    const fromDom = root.getAttribute(DATA_ATTR);
    if (isValidTheme(fromDom)) return fromDom;
  }

  const stored = readStoredTheme();
  if (stored) return stored;

  return THEMES.CLASSIC;
}

/**
 * Alterna entre classic ↔ dark (high-contrast permanece se já ativo e cycle=false).
 * @param {{ includeHighContrast?: boolean }} [options]
 * @returns {string}
 */
function toggleTheme(options = {}) {
  const { includeHighContrast = false } = options;
  const current = getTheme();
  const cycle = includeHighContrast
    ? THEME_LIST
    : [THEMES.CLASSIC, THEMES.DARK];
  const idx = cycle.indexOf(current);
  const next = cycle[(idx + 1) % cycle.length];
  return setTheme(next);
}

/**
 * Inicializa o tema na carga da aplicação (sem reload).
 * Padrão oficial: Classic. Dark/High Contrast só se já houver preferência
 * explícita válida em storage (após seleção do usuário via setTheme).
 *
 * @param {{ defaultTheme?: string, persist?: boolean, skipMigration?: boolean }} [options]
 * @returns {string}
 */
function initTheme(options = {}) {
  const {
    defaultTheme = THEMES.CLASSIC,
    persist = true,
    skipMigration = false
  } = options;

  if (!skipMigration) {
    runClassicDefaultMigration();
  }

  const fallback = isValidTheme(defaultTheme) ? defaultTheme : THEMES.CLASSIC;
  const theme = readStoredTheme() || fallback;

  return setTheme(theme, { persist });
}

module.exports = {
  THEMES,
  THEME_LIST,
  STORAGE_KEY,
  MIGRATION_KEY,
  DATA_ATTR,
  EVENT_NAME,
  setTheme,
  getTheme,
  toggleTheme,
  initTheme,
  isValidTheme
};
