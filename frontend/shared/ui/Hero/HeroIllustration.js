/**
 * HeroIllustration — assets SVG oficiais por período (Shared UI)
 *
 * Não renderiza layout. Exporta data-URI / CSS variable para wallpaper
 * via background-image do Hero (::after). Sem cards, colunas ou DOM visual.
 *
 * @module frontend/shared/ui/Hero/HeroIllustration
 */

const { PERIODS } = require('./periods');
const { SVG_BY_PERIOD } = require('./illustrations/inline');

/**
 * SVG do período para wallpaper (céu dia/noite preservado; sem radius de card).
 * @param {'morning'|'afternoon'|'sunset'|'night'} period
 * @returns {string}
 */
function getSvg(period) {
  const key = PERIODS[period] ? period : PERIODS.morning;
  let svg = SVG_BY_PERIOD[key] || SVG_BY_PERIOD[PERIODS.morning];
  // Remove radius de “card”; o céu do SVG permanece (dia claro / noite escura)
  svg = svg.replace(/\s+rx="24"/gi, '');
  return svg;
}

/**
 * @param {'morning'|'afternoon'|'sunset'|'night'} period
 * @returns {string} valor CSS url("data:image/svg+xml,...")
 */
function toDataUri(period) {
  const svg = getSvg(period);
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

/**
 * Aplica wallpaper no elemento Hero (CSS custom property).
 * @param {HTMLElement} el
 * @param {'morning'|'afternoon'|'sunset'|'night'} period
 */
function applyWallpaper(el, period) {
  if (!el) return;
  const next = PERIODS[period] ? period : PERIODS.morning;
  el.style.setProperty('--cds-hero-wallpaper', toDataUri(next));
  el.dataset.wallpaperPeriod = next;
}

/**
 * Preview DOM opcional (docs/exemplos) — NÃO usado pelo Hero operacional.
 * @param {Object} [options]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  const period = PERIODS[options.period] ? options.period : PERIODS.morning;
  const wrap = document.createElement('div');
  wrap.className = ['cds-hero-illustration-asset', options.className || ''].filter(Boolean).join(' ');
  wrap.dataset.sharedUi = 'HeroIllustration';
  wrap.dataset.period = period;
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = getSvg(period);
  return wrap;
}

module.exports = {
  NAME: 'HeroIllustration',
  PERIODS,
  getSvg,
  toDataUri,
  applyWallpaper,
  create
};
