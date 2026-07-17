/**
 * CDS Mobile RC1 — UI primitives
 * Copyright (c) 2026 CDS Sistemas
 */
import { icon } from './icons.js';
import {
  escapeHtml,
  asText,
  formatMoney,
  formatNumber,
  formatDate,
  formatDateTime,
  normalizeText,
  resolveStatus,
  entityName,
  greetingForNow,
  currentUserName,
  currentCompanyName
} from './formatters.js';

export {
  escapeHtml,
  asText,
  formatMoney,
  formatNumber,
  formatDate,
  formatDateTime,
  normalizeText,
  resolveStatus,
  entityName,
  greetingForNow,
  currentUserName,
  currentCompanyName,
  icon
};

export function loadingHtml(message = 'Carregando…') {
  return `
    <div class="cds-state cds-state--loading cds-m-enter" role="status">
      <div class="cds-state__icon">${icon('spinner', 'is-spin')}</div>
      <p class="cds-state__title">${escapeHtml(message)}</p>
    </div>
  `;
}

export function emptyHtml(message = 'Nenhum registro encontrado.', hint = '') {
  return `
    <div class="cds-state cds-state--empty cds-m-enter">
      <div class="cds-state__icon">${icon('inbox')}</div>
      <p class="cds-state__title">${escapeHtml(message)}</p>
      ${hint ? `<p class="cds-state__hint">${escapeHtml(hint)}</p>` : ''}
    </div>
  `;
}

export function errorHtml(message, status) {
  const title = status === 403
    ? 'Sem permissão'
    : status === 401
      ? 'Sessão expirada'
      : status === 408
        ? 'Tempo esgotado'
        : status === 0
          ? 'Sem conexão'
          : 'Algo deu errado';
  return `
    <div class="cds-state cds-state--error cds-m-enter" role="alert">
      <div class="cds-state__icon">${icon(status === 0 ? 'warning' : 'warning')}</div>
      <p class="cds-state__title">${escapeHtml(title)}</p>
      <p class="cds-state__hint">${escapeHtml(asText(message, 'Erro inesperado'))}</p>
      ${status ? `<span class="cds-badge cds-badge--neutral">HTTP ${escapeHtml(status)}</span>` : ''}
    </div>
  `;
}

export function offlineHtml() {
  return `
    <div class="cds-state cds-state--offline cds-m-enter" role="status">
      <div class="cds-state__icon">${icon('warning')}</div>
      <p class="cds-state__title">Você está offline</p>
      <p class="cds-state__hint">Verifique a conexão com a rede local e tente novamente.</p>
    </div>
  `;
}

export function forbiddenHtml(message = 'Você não tem permissão para este módulo.') {
  return errorHtml(message, 403);
}

export function statusBadgeHtml(status) {
  const st = resolveStatus(status);
  return `
    <span class="cds-badge cds-badge--${st.tone}">
      ${icon(st.icon, 'cds-badge__icon')}
      <span>${escapeHtml(st.label)}</span>
    </span>
  `;
}

export function kpiHtml({ id, iconName, label, value, tone = 'primary', ok = true, meta = '' }) {
  return `
    <button type="button"
      class="cds-kpi cds-kpi--${escapeHtml(tone)} ${ok ? '' : 'is-disabled'}"
      data-kpi="${escapeHtml(id)}"
      ${ok ? '' : 'disabled'}
      aria-label="${escapeHtml(label)}">
      <span class="cds-kpi__icon">${icon(iconName || 'box')}</span>
      <span class="cds-kpi__value">${ok ? escapeHtml(asText(value, '—')) : '—'}</span>
      <span class="cds-kpi__label">${escapeHtml(label)}</span>
      ${meta ? `<span class="cds-kpi__meta">${escapeHtml(meta)}</span>` : `<span class="cds-kpi__meta">${ok ? 'Ver detalhes' : 'Indisponível'}</span>`}
    </button>
  `;
}

/**
 * Card de lista mobile-first.
 * @param {{ go?: string, id?: string, title: string, subtitle?: string, meta?: string[], value?: string, status?: any, trailing?: string }} opts
 */
export function listCardHtml(opts) {
  const title = asText(opts.title, 'Item');
  const subtitle = asText(opts.subtitle, '');
  const value = opts.value != null ? asText(opts.value, '') : '';
  const meta = Array.isArray(opts.meta) ? opts.meta.map((m) => asText(m, '')).filter(Boolean) : [];
  const attrs = opts.go
    ? `data-go="${escapeHtml(opts.go)}"`
    : opts.id != null
      ? `data-id="${escapeHtml(opts.id)}"`
      : '';

  return `
    <button type="button" class="cds-list-card cds-m-rise" ${attrs}>
      <div class="cds-list-card__main">
        <div class="cds-list-card__top">
          <h3 class="cds-list-card__title">${escapeHtml(title)}</h3>
          ${opts.status != null ? statusBadgeHtml(opts.status) : ''}
        </div>
        ${subtitle ? `<p class="cds-list-card__subtitle">${escapeHtml(subtitle)}</p>` : ''}
        ${meta.length ? `
          <div class="cds-list-card__meta">
            ${meta.map((m) => `<span>${escapeHtml(m)}</span>`).join('')}
          </div>` : ''}
      </div>
      <div class="cds-list-card__side">
        ${value ? `<strong class="cds-list-card__value">${escapeHtml(value)}</strong>` : ''}
        ${icon('chevronRight', 'cds-list-card__chevron')}
      </div>
    </button>
  `;
}

export function sectionTitleHtml(title, actionLabel, actionGo) {
  return `
    <div class="cds-section-head">
      <h2 class="cds-section-head__title">${escapeHtml(title)}</h2>
      ${actionLabel && actionGo ? `
        <button type="button" class="cds-link-btn" data-go="${escapeHtml(actionGo)}">${escapeHtml(actionLabel)}</button>
      ` : ''}
    </div>
  `;
}

export function quickActionHtml(route, label, iconName) {
  return `
    <button type="button" class="cds-quick" data-go="${escapeHtml(route)}">
      <span class="cds-quick__icon">${icon(iconName)}</span>
      <span class="cds-quick__label">${escapeHtml(label)}</span>
    </button>
  `;
}

export function searchBarHtml(placeholder, id = 'mobile-search', inputmode = 'search') {
  return `
    <label class="cds-search" for="${escapeHtml(id)}">
      ${icon('search')}
      <input id="${escapeHtml(id)}" type="search" inputmode="${escapeHtml(inputmode)}"
        enterkeyhint="search" placeholder="${escapeHtml(placeholder)}" autocomplete="off">
    </label>
  `;
}

export function backBarHtml(label = 'Voltar') {
  return `
    <button type="button" class="cds-back" data-nav-back>
      ${icon('chevronLeft')} <span>${escapeHtml(label)}</span>
    </button>
  `;
}

export function bindBack(root) {
  root.querySelector('[data-nav-back]')?.addEventListener('click', () => {
    if (window.history.length > 1) window.history.back();
    else window.CDSMobile?.navigate?.('dashboard', { replace: true });
  });
}

export function bindGo(root) {
  root.querySelectorAll('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const go = btn.getAttribute('data-go');
      if (go) window.CDSMobile?.navigate?.(go);
    });
  });
}

export function debounce(fn, wait = 220) {
  let timer = null;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

export function countLabel(n, singular, plural) {
  const num = Number(n) || 0;
  return `${formatNumber(num)} ${num === 1 ? singular : plural}`;
}
