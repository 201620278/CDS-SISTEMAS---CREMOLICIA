/**
 * Conta Corrente — estilos UX-11 (extrato + Workspace)
 * Injetados via ensureStyles no mount da página.
 *
 * @module frontend/modules/motor-comercial/pages/ContaCorrente/styles
 */

const STYLE_ID = 'cds-conta-corrente-ux11-styles';

function getStyles() {
  return `
.cds-conta-corrente-workspace.cds-workspace {
  min-height: 100%;
  height: 100%;
}

.cds-conta-corrente__context {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md, 12px) var(--spacing-lg, 16px);
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--color-neutral-700, #404040);
}

.cds-conta-corrente__context strong {
  color: var(--color-neutral-900, #171717);
  font-weight: 600;
}

.cds-conta-corrente__status:empty {
  display: none;
}

.cds-conta-corrente__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg, 16px);
  min-height: 0;
}

.cds-conta-corrente__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--spacing-md, 12px);
}

.cds-conta-corrente__toolbar .cds-extrato-filters__input--wide {
  flex: 1 1 240px;
  min-width: 180px;
}

.cds-conta-corrente__toolbar .cds-extrato-filters__field {
  flex: 0 1 160px;
}

.cds-conta-corrente__count {
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-neutral-500, #737373);
  align-self: center;
}

.cds-conta-corrente__analise {
  margin-top: var(--spacing-xl, 24px);
  border-top: 1px solid var(--color-neutral-200, #e5e5e5);
  padding-top: var(--spacing-md, 12px);
}

.cds-conta-corrente__analise > summary {
  cursor: pointer;
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: 600;
  color: var(--color-neutral-600, #525252);
  list-style: none;
  padding: var(--spacing-sm, 8px) 0;
}

.cds-conta-corrente__analise > summary::-webkit-details-marker {
  display: none;
}

.cds-conta-corrente__analise-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl, 24px);
  padding-top: var(--spacing-md, 12px);
}

.cds-extrato-section__title {
  margin: 0 0 var(--spacing-md, 12px);
  font-size: var(--font-size-lg, 1.125rem);
  font-weight: 600;
}

.cds-extrato-resumo,
.cds-extrato-indicadores {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md, 12px);
}

.cds-extrato-filters__field label {
  display: block;
  font-size: var(--font-size-xs, 0.75rem);
  margin-bottom: var(--spacing-xs, 4px);
}

.cds-extrato-filters__input {
  width: 100%;
  padding: var(--spacing-sm, 8px);
  border: 1px solid var(--color-neutral-300, #d4d4d4);
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-size-sm, 0.875rem);
  box-sizing: border-box;
}

.cds-extrato-indicator {
  padding: var(--spacing-md, 12px);
  background: var(--color-neutral-50, #fafafa);
  border-radius: var(--radius-md, 8px);
}

.cds-extrato-indicator label {
  display: block;
  font-size: var(--font-size-xs, 0.75rem);
  color: var(--color-neutral-600, #525252);
}

.cds-extrato-graficos {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg, 16px);
}

.cds-extrato-chart__row {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs, 4px) 0;
  font-size: var(--font-size-sm, 0.875rem);
  border-bottom: 1px solid var(--color-neutral-100, #f5f5f5);
}

.cds-extrato-recebimento-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-md, 12px);
  padding: var(--spacing-md, 12px);
  border: 1px solid var(--color-neutral-200, #e5e5e5);
  border-radius: var(--radius-md, 8px);
  background: var(--color-neutral-50, #fafafa);
}

.cds-extrato-recebimento-banner > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cds-extrato-drawer__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md, 12px);
  font-size: var(--font-size-sm, 0.875rem);
}

.cds-extrato-drawer__ledger {
  background: var(--color-neutral-50, #fafafa);
  padding: var(--spacing-md, 12px);
  border-radius: var(--radius-md, 8px);
  font-size: var(--font-size-xs, 0.75rem);
  overflow: auto;
  max-height: 200px;
}

.cds-extrato-drawer__actions {
  display: flex;
  gap: var(--spacing-sm, 8px);
  margin-top: var(--spacing-md, 12px);
}

@media print {
  .cds-workspace__footer,
  .cds-workspace__header-actions,
  .cds-conta-corrente__toolbar,
  .cds-conta-corrente__analise {
    display: none !important;
  }
}

@media (max-width: 1280px) {
  .cds-extrato-resumo,
  .cds-extrato-indicadores {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .cds-extrato-resumo,
  .cds-extrato-indicadores,
  .cds-extrato-graficos {
    grid-template-columns: 1fr;
  }
}
`.trim();
}

function ensureStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = getStyles();
  document.head.appendChild(style);
}

module.exports = {
  STYLE_ID,
  getStyles,
  ensureStyles
};
