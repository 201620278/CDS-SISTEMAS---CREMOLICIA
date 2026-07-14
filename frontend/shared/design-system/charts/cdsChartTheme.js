/**
 * CDS Chart Theme — Identidade visual premium dos gráficos
 * Sprint UX/UI 2.1
 *
 * Biblioteca: Chart.js (já utilizada no ERP).
 * Não altera dados nem APIs — apenas defaults e helpers de estilo.
 *
 * Uso (browser):
 *   <script src="/shared/design-system/charts/cdsChartTheme.js"></script>
 *   const opts = CDSChartTheme.baseOptions({ ... });
 */
(function (global) {
  'use strict';

  function cssVar(name, fallback) {
    if (typeof document === 'undefined' || !document.documentElement) return fallback;
    try {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function hexToRgba(hex, alpha) {
    const raw = String(hex || '').replace('#', '');
    if (raw.length !== 6) return `rgba(51, 65, 85, ${alpha})`;
    const r = parseInt(raw.slice(0, 2), 16);
    const g = parseInt(raw.slice(2, 4), 16);
    const b = parseInt(raw.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function palette() {
    return {
      receita: cssVar('--color-neutral-700', '#334155'),
      receitaSoft: cssVar('--color-neutral-600', '#475569'),
      hover: cssVar('--color-accent-500', '#c9922e'),
      hoverSoft: cssVar('--color-accent-300', '#e8b84a'),
      comparativo: cssVar('--color-neutral-400', '#94a3b8'),
      volume: cssVar('--color-neutral-500', '#64748b'),
      grid: hexToRgba(cssVar('--color-neutral-400', '#94a3b8'), 0.14),
      text: cssVar('--color-text-muted', cssVar('--color-neutral-500', '#64748b')),
      textStrong: cssVar('--color-text', cssVar('--color-neutral-900', '#0f172a')),
      surface: cssVar('--color-surface'),
      border: cssVar('--color-border', '#e2e8f0'),
      barTrack: cssVar('--color-neutral-100', '#f1f5f9'),
      success: cssVar('--color-success-600', '#16a34a'),
      danger: cssVar('--color-error-600', '#dc2626'),
      warning: cssVar('--color-warning-600', '#d97706'),
      mutedBar: cssVar('--color-neutral-300', '#cbd5e1')
    };
  }

  function fontFamily() {
    return cssVar(
      '--font-family-primary',
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    );
  }

  function areaGradient(chart, hexColor, maxOpacity) {
    const ctx = chart.ctx;
    const chartArea = chart.chartArea;
    if (!chartArea) return hexToRgba(hexColor, maxOpacity || 0.08);
    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, hexToRgba(hexColor, maxOpacity || 0.1));
    gradient.addColorStop(1, hexToRgba(hexColor, 0.02));
    return gradient;
  }

  function applyDefaults(Chart) {
    if (!Chart || !Chart.defaults) return;
    const p = palette();
    Chart.defaults.font.family = fontFamily();
    Chart.defaults.font.size = 11;
    Chart.defaults.color = p.text;
    Chart.defaults.borderColor = p.grid;
    Chart.defaults.animation = {
      duration: 700,
      easing: 'easeOutQuad'
    };
    Chart.defaults.elements.line.borderWidth = 2.5;
    Chart.defaults.elements.line.tension = 0.35;
    Chart.defaults.elements.point.radius = 0;
    Chart.defaults.elements.point.hoverRadius = 4;
    Chart.defaults.elements.point.hitRadius = 8;
    Chart.defaults.elements.bar.borderRadius = 3;
    Chart.defaults.elements.bar.borderSkipped = false;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 8;
    Chart.defaults.plugins.legend.labels.padding = 16;
    Chart.defaults.plugins.tooltip.backgroundColor = p.surface;
    Chart.defaults.plugins.tooltip.titleColor = p.textStrong;
    Chart.defaults.plugins.tooltip.bodyColor = p.receitaSoft;
    Chart.defaults.plugins.tooltip.borderColor = p.border;
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.displayColors = true;
    Chart.defaults.plugins.tooltip.boxPadding = 4;
    Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 12, family: fontFamily() };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 12, family: fontFamily() };
    Chart.defaults.plugins.tooltip.caretSize = 5;
    Chart.defaults.plugins.tooltip.caretPadding = 8;
  }

  function scaleY(extra) {
    const p = palette();
    return deepMerge({
      beginAtZero: true,
      border: { display: false },
      grid: {
        color: p.grid,
        drawBorder: false,
        lineWidth: 1,
        tickLength: 0
      },
      ticks: {
        color: p.text,
        font: { size: 10, family: fontFamily() },
        padding: 8,
        maxTicksLimit: 5
      }
    }, extra || {});
  }

  function scaleX(extra) {
    const p = palette();
    return deepMerge({
      border: { display: false },
      grid: { display: false, drawBorder: false },
      ticks: {
        color: p.text,
        font: { size: 10, family: fontFamily() },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 8,
        padding: 6
      }
    }, extra || {});
  }

  function tooltipDefaults(extra) {
    const p = palette();
    return Object.assign({
      backgroundColor: p.surface,
      titleColor: p.textStrong,
      bodyColor: p.receitaSoft,
      borderColor: p.border,
      borderWidth: 1,
      cornerRadius: 10,
      padding: 12,
      displayColors: true,
      boxPadding: 4,
      usePointStyle: true,
      titleMarginBottom: 8,
      bodySpacing: 4,
      caretSize: 5,
      caretPadding: 10,
      titleFont: { weight: '600', size: 12, family: fontFamily() },
      bodyFont: { size: 12, family: fontFamily() }
    }, extra || {});
  }

  function legendDefaults(extra) {
    return Object.assign({
      position: 'bottom',
      align: 'start',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 7,
        boxHeight: 7,
        padding: 14,
        font: { size: 11, family: fontFamily() },
        color: palette().text
      }
    }, extra || {});
  }

  function baseOptions(overrides) {
    const base = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 700, easing: 'easeOutQuad' },
      // Evita interpolar cores scriptáveis (causa this._fn is not a function no Chart.js)
      animations: {
        colors: false,
        backgroundColor: false,
        borderColor: false
      },
      layout: { padding: { top: 8, right: 8, bottom: 0, left: 4 } },
      plugins: {
        legend: legendDefaults(),
        tooltip: tooltipDefaults()
      },
      scales: {
        x: scaleX(),
        y: scaleY()
      }
    };

    return deepMerge(base, overrides || {});
  }

  function deepMerge(target, source) {
    if (!source) return target;
    const out = Array.isArray(target) ? target.slice() : Object.assign({}, target);
    Object.keys(source).forEach((key) => {
      const sv = source[key];
      const tv = out[key];
      if (sv && typeof sv === 'object' && !Array.isArray(sv) && tv && typeof tv === 'object' && !Array.isArray(tv)) {
        out[key] = deepMerge(tv, sv);
      } else {
        out[key] = sv;
      }
    });
    return out;
  }

  /** Dataset de linha (receita) com área discreta (opacidade fixa — sem função animável) */
  function lineReceita(label, data) {
    const p = palette();
    return {
      label,
      data,
      type: 'line',
      borderColor: p.receita,
      backgroundColor: hexToRgba(p.receita, 0.08),
      borderWidth: 2.5,
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: p.hover,
      pointHoverBorderColor: cssVar('--color-surface'),
      pointHoverBorderWidth: 2,
      hoverBorderColor: p.hover
    };
  }

  /** Dataset comparativo (cinza tracejado) */
  function lineComparativo(label, data) {
    const p = palette();
    return {
      label,
      data,
      type: 'line',
      borderColor: p.comparativo,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [5, 4],
      fill: false,
      tension: 0.3,
      pointRadius: 0,
      pointHoverRadius: 3,
      pointHoverBackgroundColor: p.comparativo
    };
  }

  /** Dataset de volume */
  function lineVolume(label, data, yAxisID) {
    const p = palette();
    return {
      label,
      data,
      type: 'line',
      borderColor: p.volume,
      backgroundColor: 'transparent',
      borderWidth: 2,
      fill: false,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: p.hover,
      pointHoverBorderColor: cssVar('--color-surface'),
      pointHoverBorderWidth: 2,
      yAxisID: yAxisID || 'y'
    };
  }

  /** Barras finas / discretas */
  function barsDiscrete(label, data, colors) {
    const p = palette();
    const fills = colors || [
      hexToRgba(p.receita, 0.55),
      hexToRgba(p.comparativo, 0.55),
      hexToRgba(p.volume, 0.45),
      hexToRgba(p.hover, 0.45)
    ];
    return {
      label,
      data,
      backgroundColor: fills,
      hoverBackgroundColor: fills.map(() => p.hover),
      borderWidth: 0,
      borderRadius: 4,
      maxBarThickness: 28,
      categoryPercentage: 0.55,
      barPercentage: 0.7
    };
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function formatDelta(pct) {
    if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
    const n = Number(pct);
    const sign = n > 0 ? '+' : '';
    return `${sign}${n.toFixed(1)}%`;
  }

  function deltaClass(pct) {
    if (pct === null || pct === undefined || Number.isNaN(pct)) return 'is-flat';
    if (Number(pct) > 0) return 'is-up';
    if (Number(pct) < 0) return 'is-down';
    return 'is-flat';
  }

  /**
   * Monta HTML do strip de KPIs acima do gráfico.
   * @param {Array<{label:string,value:string,delta?:number|null,hint?:string}>} items
   */
  function renderKpiStrip(items) {
    const list = Array.isArray(items) ? items : [];
    return `
      <div class="cds-chart-kpi" role="group" aria-label="Resumo do período">
        ${list.map((item) => {
          const delta = item.delta;
          const deltaText = formatDelta(delta);
          const cls = deltaClass(delta);
          const arrow = cls === 'is-up' ? '▲' : cls === 'is-down' ? '▼' : '●';
          return `
            <div class="cds-chart-kpi__item">
              <div class="cds-chart-kpi__label">${item.label || ''}</div>
              <div class="cds-chart-kpi__value">${item.value || '—'}</div>
              ${deltaText ? `<div class="cds-chart-kpi__delta ${cls}"><span>${arrow} ${deltaText}</span></div>` : ''}
              ${item.hint ? `<div class="cds-chart-kpi__hint">${item.hint}</div>` : ''}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  const api = {
    palette,
    cssVar,
    hexToRgba,
    areaGradient,
    applyDefaults,
    baseOptions,
    scaleX,
    scaleY,
    tooltipDefaults,
    legendDefaults,
    lineReceita,
    lineComparativo,
    lineVolume,
    barsDiscrete,
    formatCurrency,
    formatDelta,
    deltaClass,
    renderKpiStrip,
    deepMerge
  };

  global.CDSChartTheme = api;

  if (typeof Chart !== 'undefined') {
    applyDefaults(Chart);
  } else if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      if (typeof Chart !== 'undefined') applyDefaults(Chart);
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
