/**
 * Style Injector — delega ao CDS Design System oficial
 *
 * @module frontend/modules/motor-comercial/styles/inject
 */

const { injectDesignSystemStyles } = require('../../../shared/design-system/styles/inject');

const STYLE_ID = 'motor-comercial-styles';

function injectMotorComercialStyles() {
  injectDesignSystemStyles();

  if (typeof document === 'undefined') return;

  const extra = `
    #page-content .motor-comercial-page { width: 100%; min-height: calc(100vh - 120px); }
    #motor-comercial-loading {
      position: fixed; inset: 0; display: none; align-items: center; justify-content: center;
      background: var(--color-overlay, rgba(15, 23, 42, 0.45)); z-index: 10050;
    }
    #motor-comercial-loading.is-active { display: flex; }
    @media (max-width: 1200px) {
      .cds-dashboard-layout__main, .cds-consulta-layout__body, .cds-wizard-layout__body { flex-direction: column; }
      .cds-dashboard-layout__sidebar, .cds-consulta-layout__sidebar { width: 100%; max-width: none; }
    }
  `;

  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = extra;
}

module.exports = { injectMotorComercialStyles };
