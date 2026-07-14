/**
 * WizardLayout — Wizard Layout Component
 *
 * Sprint 2.7: Arquitetura Frontend — layout Wizard.
 *
 * @module frontend/modules/motor-comercial/components/layouts/WizardLayout
 */

const theme = require('../../theme');

class WizardLayout {
  /**
   * Creates a wizard layout.
   * @param {Object} options
   * @param {HTMLElement} options.header - Header content
   * @param {HTMLElement} options.steps - Steps indicator
   * @param {HTMLElement} options.content - Step content
   * @param {HTMLElement} options.actions - Action buttons
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      header = null,
      steps: stepsOption = null,
      stepper = null,
      content: contentOption = null,
      sidebar = null,
      actions: actionsOption = null,
      footer = null
    } = options;

    const steps = stepsOption || stepper || null;
    const actions = actionsOption || footer || null;
    let content = contentOption;

    if (content && sidebar) {
      const body = document.createElement('div');
      body.className = 'cds-wizard-layout__body';
      body.appendChild(content);
      const sidebarEl = document.createElement('aside');
      sidebarEl.className = 'cds-wizard-layout__sidebar';
      sidebarEl.appendChild(sidebar);
      body.appendChild(sidebarEl);
      content = body;
    }

    const layout = document.createElement('div');
    layout.className = 'cds-wizard-layout';

    if (header) {
      const headerEl = document.createElement('header');
      headerEl.className = 'cds-wizard-layout__header';
      headerEl.appendChild(header);
      layout.appendChild(headerEl);
    }

    if (steps) {
      const stepsEl = document.createElement('div');
      stepsEl.className = 'cds-wizard-layout__steps';
      stepsEl.appendChild(steps);
      layout.appendChild(stepsEl);
    }

    if (content) {
      const contentEl = document.createElement('main');
      contentEl.className = 'cds-wizard-layout__content';
      contentEl.appendChild(content);
      layout.appendChild(contentEl);
    }

    if (actions) {
      const actionsEl = document.createElement('footer');
      actionsEl.className = 'cds-wizard-layout__actions';
      actionsEl.appendChild(actions);
      layout.appendChild(actionsEl);
    }

    return layout;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-wizard-layout {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        background-color: ${t.colors.neutral[50]};
      }

      .cds-wizard-layout__header {
        background-color: var(--color-surface);
        border-bottom: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.md} ${t.spacing.lg};
      }

      .cds-wizard-layout__steps {
        background-color: var(--color-surface);
        border-bottom: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.lg};
      }

      .cds-wizard-layout__content {
        flex: 1;
        min-height: 0;
        padding: ${t.spacing.xl};
        overflow-y: auto;
      }

      .cds-wizard-layout__body {
        display: flex;
        gap: ${t.spacing.lg};
        align-items: flex-start;
      }

      .cds-wizard-layout__body > :first-child {
        flex: 1;
        min-width: 0;
      }

      .cds-wizard-layout__sidebar {
        width: 320px;
        flex-shrink: 0;
      }

      @media (max-width: ${t.breakpoints.lg}) {
        .cds-wizard-layout__body {
          flex-direction: column;
        }
        .cds-wizard-layout__sidebar {
          width: 100%;
        }
      }

      .cds-wizard-layout__actions {
        background-color: var(--color-surface);
        border-top: 1px solid ${t.colors.neutral[200]};
        padding: ${t.spacing.md} ${t.spacing.lg};
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
    `;
  }
}

module.exports = WizardLayout;
