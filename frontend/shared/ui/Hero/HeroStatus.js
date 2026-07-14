/**
 * HeroStatus — resumo operacional genérico (sem domínio)
 * @module frontend/shared/ui/Hero/HeroStatus
 */

const TONE_DOT = Object.freeze({
  urgent: '🔴',
  ready: '🟢',
  info: '🔵',
  warn: '🟡',
  neutral: '⚪'
});

/**
 * @typedef {{ tone?: string, text: string }} StatusItem
 */

/**
 * @param {Object} [options]
 * @param {StatusItem[]} [options.items]
 * @param {string} [options.lead]
 * @param {string} [options.message]
 * @param {string} [options.className]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  const root = document.createElement('div');
  root.className = ['cds-hero__status', options.className || ''].filter(Boolean).join(' ');
  root.dataset.sharedUi = 'HeroStatus';
  update(root, options);
  return root;
}

/**
 * @param {HTMLElement} el
 * @param {Object} [options]
 */
function update(el, options = {}) {
  if (!el) return;
  el.innerHTML = '';

  const items = Array.isArray(options.items) ? options.items.filter((i) => i && i.text) : [];
  const lead = options.lead != null ? String(options.lead) : (items.length ? 'Você possui:' : '');
  const message = options.message != null ? String(options.message) : '';

  if (lead) {
    const leadEl = document.createElement('p');
    leadEl.className = 'cds-hero__status-lead';
    leadEl.textContent = lead;
    el.appendChild(leadEl);
  }

  if (items.length) {
    const list = document.createElement('ul');
    list.className = 'cds-hero__status-list';
    items.forEach((item) => {
      const tone = item.tone || 'info';
      const li = document.createElement('li');
      li.className = `cds-hero__status-item cds-hero__status-item--${tone}`;
      const dot = TONE_DOT[tone] || TONE_DOT.info;
      li.textContent = `${dot} ${item.text}`;
      list.appendChild(li);
    });
    el.appendChild(list);
  }

  if (message) {
    const msg = document.createElement('p');
    msg.className = 'cds-hero__status-message';
    msg.textContent = message;
    el.appendChild(msg);
  }
}

module.exports = {
  NAME: 'HeroStatus',
  TONE_DOT,
  create,
  update
};
