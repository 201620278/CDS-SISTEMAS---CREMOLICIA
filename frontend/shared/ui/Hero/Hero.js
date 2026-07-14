/**
 * Hero — Shared UI (UX-21.1 / UX-21.3)
 *
 * Hero inteligente e reutilizável para Centrais da Plataforma CDS.
 * Ilustração = wallpaper de BACKGROUND (::after + máscara). Sem coluna/card.
 *
 * @module frontend/shared/ui/Hero/Hero
 */

const HeroGreeting = require('./HeroGreeting');
const HeroIllustration = require('./HeroIllustration');
const HeroActions = require('./HeroActions');
const HeroStatus = require('./HeroStatus');
const { resolvePeriod } = require('./periods');

const STATUS = 'ready';
const STYLE_ID = 'cds-shared-ui-hero-styles';
const CLOCK_MS = 30000;

/**
 * @param {Object} [options]
 * @param {string} [options.operatorName]
 * @param {Date} [options.now]
 * @param {Array<{tone?:string,text:string}>} [options.statusItems]
 * @param {string} [options.lead]
 * @param {string} [options.message]
 * @param {Array<{label:string,variant?:string,onClick?:Function,disabled?:boolean}>} [options.actions]
 * @param {boolean} [options.liveClock=true]
 * @param {string} [options.className]
 * @param {boolean} [options.injectStyles=true]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  if (options.injectStyles !== false) ensureStyles();

  const state = {
    operatorName: options.operatorName,
    statusItems: options.statusItems,
    lead: options.lead,
    message: options.message,
    actions: options.actions
  };

  const now = options.now instanceof Date ? options.now : new Date();
  const period = resolvePeriod(now);

  const root = document.createElement('section');
  root.className = [
    'cds-hero',
    `cds-hero--${period}`,
    options.className || ''
  ].filter(Boolean).join(' ');
  root.dataset.sharedUi = 'Hero';
  root.dataset.period = period;
  root.setAttribute('aria-label', 'Hero operacional');

  // Wallpaper via CSS variable → ::after (não cria nó visual)
  HeroIllustration.applyWallpaper(root, period);

  const content = document.createElement('div');
  content.className = 'cds-hero__content';

  const greeting = HeroGreeting.create({
    operatorName: state.operatorName,
    now
  });
  const status = HeroStatus.create({
    items: state.statusItems,
    lead: state.lead,
    message: state.message
  });
  const actions = HeroActions.create({ actions: state.actions });

  content.appendChild(greeting);
  content.appendChild(status);
  content.appendChild(actions);
  root.appendChild(content);

  requestAnimationFrame(() => {
    root.classList.add('cds-hero--ready');
  });

  const api = {
    update(partial = {}) {
      Object.assign(state, partial);
      const stamp = partial.now instanceof Date ? partial.now : new Date();
      const nextPeriod = resolvePeriod(stamp);

      HeroGreeting.update(greeting, {
        operatorName: state.operatorName,
        now: stamp
      });
      HeroStatus.update(status, {
        items: state.statusItems,
        lead: state.lead,
        message: state.message
      });

      if (root.dataset.period !== nextPeriod) {
        root.dataset.period = nextPeriod;
        root.classList.remove(
          'cds-hero--morning',
          'cds-hero--afternoon',
          'cds-hero--sunset',
          'cds-hero--night'
        );
        root.classList.add(`cds-hero--${nextPeriod}`);
        HeroIllustration.applyWallpaper(root, nextPeriod);
      }
    },
    destroy() {
      if (api._timer) {
        clearInterval(api._timer);
        api._timer = null;
      }
    },
    getPeriod: () => root.dataset.period,
    _timer: null
  };

  root.cdsHero = api;

  if (options.liveClock !== false && !(options.now instanceof Date)) {
    api._timer = setInterval(() => {
      if (!root.isConnected) {
        api.destroy();
        return;
      }
      api.update({ now: new Date() });
    }, CLOCK_MS);
  }

  return root;
}

function ensureStyles() {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  // Sempre reescreve — garante wallpaper (::after) após hot updates
  style.textContent = getStyles();
}

function getStyles() {
  return `
.cds-hero {
  --cds-hero-wallpaper: none;
  position: relative;
  isolation: isolate;
  width: 100%;
  box-sizing: border-box;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.45s ease, transform 0.45s ease, background 0.5s ease;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.85);
  overflow: hidden;
  min-height: 188px;
}

.cds-hero--ready {
  opacity: 1;
  transform: translateY(0);
}

.cds-hero *,
.cds-hero *::before,
.cds-hero *::after {
  box-sizing: border-box;
}

/* Wallpaper integrado — NÃO é coluna, card ou nó de layout */
.cds-hero::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(255, 255, 255, 0.92) 34%,
      rgba(255, 255, 255, 0.55) 52%,
      rgba(255, 255, 255, 0.18) 68%,
      transparent 82%
    ),
    var(--cds-hero-wallpaper);
  background-repeat: no-repeat, no-repeat;
  background-position: center center, right center;
  background-size: 100% 100%, auto 112%;
  -webkit-mask-image: linear-gradient(
    90deg,
    transparent 0%,
    transparent 22%,
    rgba(0, 0, 0, 0.25) 40%,
    rgba(0, 0, 0, 0.75) 62%,
    #000 100%
  );
  mask-image: linear-gradient(
    90deg,
    transparent 0%,
    transparent 22%,
    rgba(0, 0, 0, 0.25) 40%,
    rgba(0, 0, 0, 0.75) 62%,
    #000 100%
  );
  opacity: 0.92;
}

.cds-hero__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 16px 20px;
  min-width: 0;
  max-width: min(640px, 70%);
}

.cds-hero__title {
  margin: 0;
  font-size: clamp(1.35rem, 1.8vw, 1.7rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--color-neutral-900, #0f172a);
}

.cds-hero__datetime {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-neutral-600, #475569);
}

.cds-hero__status {
  margin-top: 0.1rem;
}

.cds-hero__status-lead {
  margin: 0 0 0.2rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-neutral-700, #334155);
}

.cds-hero__status-list {
  list-style: none;
  margin: 0 0 0.3rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.cds-hero__status-item {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-neutral-800, #1e293b);
  line-height: 1.3;
}

.cds-hero__status-message {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.35;
  color: var(--color-neutral-600, #475569);
}

.cds-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.3rem;
  padding-top: 0;
}

.cds-hero__action {
  min-height: 36px;
  min-width: 120px;
  padding: 0.45rem 0.95rem;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 650;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.cds-hero__action:hover:not(:disabled) {
  transform: translateY(-1px);
}

.cds-hero__action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cds-hero__action--primary {
  background: var(--color-primary, #2563eb);
  color: #fff;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.18);
}

.cds-hero__action--primary:hover:not(:disabled) {
  filter: brightness(1.04);
}

.cds-hero__action--secondary {
  background: rgba(255, 255, 255, 0.88);
  border-color: var(--color-neutral-200, #e2e8f0);
  color: var(--color-neutral-800, #1e293b);
}

.cds-hero__action--secondary:hover:not(:disabled) {
  border-color: var(--color-neutral-300, #cbd5e1);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.06);
}

.cds-hero--morning {
  background: linear-gradient(135deg, #f7fbff 0%, #e8f3ff 48%, #f8fafc 100%);
}

.cds-hero--morning::after {
  background-image:
    linear-gradient(
      90deg,
      #f7fbff 0%,
      rgba(247, 251, 255, 0.92) 34%,
      rgba(232, 243, 255, 0.45) 55%,
      transparent 78%
    ),
    var(--cds-hero-wallpaper);
}

.cds-hero--afternoon {
  background: linear-gradient(135deg, #f8fbff 0%, #d6e8fb 50%, #f8fafc 100%);
}

.cds-hero--afternoon::after {
  background-image:
    linear-gradient(
      90deg,
      #f8fbff 0%,
      rgba(248, 251, 255, 0.9) 34%,
      rgba(214, 232, 251, 0.4) 55%,
      transparent 78%
    ),
    var(--cds-hero-wallpaper);
}

.cds-hero--sunset {
  background: linear-gradient(135deg, #fffaf5 0%, #f7d9b8 48%, #f8fafc 100%);
}

.cds-hero--sunset::after {
  background-image:
    linear-gradient(
      90deg,
      #fffaf5 0%,
      rgba(255, 250, 245, 0.9) 34%,
      rgba(247, 217, 184, 0.4) 55%,
      transparent 78%
    ),
    var(--cds-hero-wallpaper);
}

.cds-hero--night {
  background: linear-gradient(135deg, #eef2f7 0%, #dbe3ee 45%, #1e293b 100%);
}

.cds-hero--night::after {
  background-image:
    linear-gradient(
      90deg,
      #eef2f7 0%,
      rgba(238, 242, 247, 0.94) 30%,
      rgba(226, 232, 240, 0.35) 48%,
      transparent 66%
    ),
    var(--cds-hero-wallpaper);
  opacity: 1;
}

@media (max-width: 1365px) {
  .cds-hero {
    min-height: 176px;
  }

  .cds-hero__content {
    padding: 14px 16px;
    max-width: 76%;
  }

  .cds-hero::after {
    background-size: 100% 100%, auto 108%;
  }
}

@media (max-width: 1100px) {
  .cds-hero {
    min-height: 0;
  }

  .cds-hero__content {
    max-width: 100%;
  }

  .cds-hero::after {
    background-size: 100% 100%, auto 100%;
    background-position: center center, 70% center;
    opacity: 0.75;
  }
}

@media (min-width: 1600px) {
  .cds-hero {
    min-height: 200px;
  }

  .cds-hero__title {
    font-size: 1.75rem;
  }
}

@media (min-width: 1920px) {
  .cds-hero__content {
    padding: 18px 24px;
  }

  .cds-hero::after {
    background-size: 100% 100%, auto 118%;
  }
}
`.trim();
}

const Hero = {
  STATUS,
  NAME: 'Hero',
  DS: 'Hero',
  create,
  ensureStyles,
  getStyles,
  Greeting: HeroGreeting,
  Illustration: HeroIllustration,
  Actions: HeroActions,
  Status: HeroStatus
};

module.exports = Hero;
