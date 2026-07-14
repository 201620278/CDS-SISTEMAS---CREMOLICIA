/**
 * HeroGreeting — saudação + data/hora inteligentes
 * @module frontend/shared/ui/Hero/HeroGreeting
 */

const { resolvePeriod, greetingForPeriod, formatHeroDateTime } = require('./periods');

/**
 * @param {Object} [options]
 * @param {string} [options.operatorName]
 * @param {Date} [options.now]
 * @param {string} [options.className]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  const root = document.createElement('div');
  root.className = ['cds-hero__greeting', options.className || ''].filter(Boolean).join(' ');
  root.dataset.sharedUi = 'HeroGreeting';

  const title = document.createElement('h2');
  title.className = 'cds-hero__title';

  const datetime = document.createElement('p');
  datetime.className = 'cds-hero__datetime';

  root.appendChild(title);
  root.appendChild(datetime);

  update(root, options);
  return root;
}

/**
 * @param {HTMLElement} el
 * @param {Object} [options]
 */
function update(el, options = {}) {
  if (!el) return;
  const now = options.now instanceof Date ? options.now : new Date();
  const name = String(options.operatorName || 'Operador').trim() || 'Operador';
  const period = resolvePeriod(now);
  const { emoji, salutation } = greetingForPeriod(period);
  const { fullLabel } = formatHeroDateTime(now);

  const title = el.querySelector('.cds-hero__title');
  const datetime = el.querySelector('.cds-hero__datetime');
  if (title) title.textContent = `${emoji} ${salutation}, ${name}.`;
  if (datetime) datetime.textContent = fullLabel;
  el.dataset.period = period;
}

module.exports = {
  NAME: 'HeroGreeting',
  create,
  update
};
