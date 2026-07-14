/**
 * CDS Design System — Injeção de estilos oficiais
 *
 * Sprint UX/UI 2.0.1: carrega a fundação CSS (tokens/temas/componentes)
 * de forma aditiva, sem alterar telas existentes.
 *
 * @module frontend/shared/design-system/styles/inject
 */

const theme = require('../theme');
const { initTheme } = require('../themes/ThemeManager');

const primitives = {
  base: require('../primitives/base'),
  layouts: require('../primitives/layouts'),
  form: require('../primitives/form'),
  data: require('../primitives/data'),
  navigation: require('../primitives/navigation'),
  special: require('../primitives/special')
};

const dsComponents = require('../components');

const STYLE_ID = 'cds-design-system-styles';
const FOUNDATION_LINK_ID = 'cds-design-system-foundation';
const FOUNDATION_HREF = '/shared/design-system/index.css';

function buildThemeVariables() {
  const spacing = Object.entries(theme.spacing)
    .map(([key, value]) => `  --spacing-${key}: ${value};`)
    .join('\n');

  const fontSize = Object.entries(theme.typography.fontSize)
    .map(([key, value]) => `  --font-size-${key}: ${value};`)
    .join('\n');

  const fontWeight = Object.entries(theme.typography.fontWeight)
    .map(([key, value]) => `  --font-weight-${key}: ${value};`)
    .join('\n');

  const colorGroups = ['primary', 'neutral', 'success', 'warning', 'error'];
  const colors = colorGroups.map((group) => {
    const palette = theme.colors[group] || {};
    return Object.entries(palette)
      .map(([key, value]) => `  --color-${group}-${key}: ${value};`)
      .join('\n');
  }).join('\n');

  return `
    :root {
${spacing}
${fontSize}
${fontWeight}
${colors}
      --font-family-primary: ${theme.typography.fontFamily.primary};
      --radius-sm: ${theme.radius.sm};
      --radius-md: ${theme.radius.md};
      --radius-lg: ${theme.radius.lg};
      --shadow-sm: ${theme.shadow.sm};
      --shadow-md: ${theme.shadow.md};
    }

    .cds-design-system-page,
    #page-content .motor-comercial-page {
      font-family: var(--font-family-primary);
      color: var(--color-text);
      background-color: var(--color-bg);
    }
  `;
}

function collectStylesFromModule(mod) {
  if (!mod || typeof mod !== 'object') return '';
  if (typeof mod.getStyles === 'function') return mod.getStyles();
  return Object.values(mod)
    .filter((m) => m && typeof m.getStyles === 'function')
    .map((m) => m.getStyles())
    .join('\n');
}

function collectAllStyles() {
  const parts = [
    collectStylesFromModule(primitives.base),
    collectStylesFromModule(primitives.layouts),
    collectStylesFromModule(primitives.form),
    collectStylesFromModule(primitives.data),
    collectStylesFromModule(primitives.navigation),
    collectStylesFromModule(primitives.special),
    collectStylesFromModule(dsComponents.layouts),
    collectStylesFromModule(dsComponents.buttons),
    collectStylesFromModule(dsComponents.forms),
    collectStylesFromModule(dsComponents.feedback),
    collectStylesFromModule(dsComponents.navigation),
    collectStylesFromModule(dsComponents.search),
    collectStylesFromModule(dsComponents.cards),
    collectStylesFromModule(dsComponents.data)
  ];

  return parts.join('\n');
}

/**
 * Carrega a fundação visual CSS (tokens, temas, componentes, animações).
 * Idempotente. Não exige reload.
 */
function injectFoundationStyles() {
  if (typeof document === 'undefined') return false;
  if (document.getElementById(FOUNDATION_LINK_ID)) return true;

  const link = document.createElement('link');
  link.id = FOUNDATION_LINK_ID;
  link.rel = 'stylesheet';
  link.href = FOUNDATION_HREF;
  document.head.appendChild(link);
  return true;
}

/**
 * Injeta estilos dos componentes JS legados + fundação CSS + tema ativo.
 */
function injectDesignSystemStyles(options = {}) {
  if (typeof document === 'undefined') return;

  const { initThemeOnInject = true } = options;

  injectFoundationStyles();

  if (initThemeOnInject) {
    initTheme({ defaultTheme: 'classic' });
  }

  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `${buildThemeVariables()}\n${collectAllStyles()}`;
  document.head.appendChild(style);
}

module.exports = {
  STYLE_ID,
  FOUNDATION_LINK_ID,
  FOUNDATION_HREF,
  buildThemeVariables,
  collectAllStyles,
  injectFoundationStyles,
  injectDesignSystemStyles
};
