/**
 * CDSStatusIndicator — Indicador de status oficial
 *
 * @module frontend/shared/design-system/components/data/CDSStatusIndicator
 */

const theme = require('../../theme');

const STATUS_COLORS = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'primary',
  neutral: 'neutral'
};

class CDSStatusIndicator {
  static create(options = {}) {
    const { status = 'neutral', label = '', pulse = false } = options;
    const el = document.createElement('span');
    el.className = `cds-status-indicator cds-status-indicator--${status}${pulse ? ' cds-status-indicator--pulse' : ''}`;
    el.innerHTML = `<span class="cds-status-indicator__dot"></span><span class="cds-status-indicator__label">${label}</span>`;
    return el;
  }

  static getStyles() {
    const t = theme;
    const variants = Object.entries(STATUS_COLORS).map(([name, palette]) => `
      .cds-status-indicator--${name} .cds-status-indicator__dot { background: ${t.colors[palette][500]}; }
    `).join('');
    return `
      .cds-status-indicator { display: inline-flex; align-items: center; gap: ${t.spacing.sm}; font-size: ${t.typography.fontSize.sm}; }
      .cds-status-indicator__dot { width: 8px; height: 8px; border-radius: 50%; }
      ${variants}
      .cds-status-indicator--pulse .cds-status-indicator__dot { animation: cds-pulse 1.5s infinite; }
      @keyframes cds-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    `;
  }
}

module.exports = CDSStatusIndicator;
