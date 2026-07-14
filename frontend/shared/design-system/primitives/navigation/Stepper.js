/**
 * Stepper — Navigation Stepper Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Stepper.
 * Sprint 3.2: Wizard de Nova Consignação — estados adicionais (error, blocked).
 *
 * @module frontend/modules/motor-comercial/components/navigation/Stepper
 */

const theme = require('../../theme');

class Stepper {
  /**
   * Creates a stepper element.
   * @param {Object} options
   * @param {Array} options.steps - Step definitions with optional state
   * @param {number} options.currentStep - Current step index
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      steps = [],
      currentStep = 0
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-stepper';

    steps.forEach((step, index) => {
      const stepState = step.state || 'pending';
      const stepEl = document.createElement('div');
      
      let classes = 'cds-stepper__step';
      
      if (index < currentStep) {
        classes += ' cds-stepper__step--completed';
      } else if (index === currentStep) {
        classes += ' cds-stepper__step--active';
      }
      
      if (stepState === 'error') {
        classes += ' cds-stepper__step--error';
      } else if (stepState === 'blocked') {
        classes += ' cds-stepper__step--blocked';
      }
      
      stepEl.className = classes;

      const stepNumber = document.createElement('div');
      stepNumber.className = 'cds-stepper__number';
      
      if (index < currentStep) {
        stepNumber.innerHTML = '✓';
      } else if (stepState === 'error') {
        stepNumber.innerHTML = '✕';
      } else if (stepState === 'blocked') {
        stepNumber.innerHTML = '⚠';
      } else {
        stepNumber.textContent = index + 1;
      }

      stepEl.appendChild(stepNumber);

      const stepLabel = document.createElement('div');
      stepLabel.className = 'cds-stepper__label';
      stepLabel.textContent = step.label;
      stepEl.appendChild(stepLabel);

      container.appendChild(stepEl);

      if (index < steps.length - 1) {
        const connector = document.createElement('div');
        connector.className = 'cds-stepper__connector';
        container.appendChild(connector);
      }
    });

    return container;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-stepper {
        display: flex;
        align-items: center;
        gap: ${t.spacing.md};
        margin-bottom: ${t.spacing.xl};
      }

      .cds-stepper__step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: ${t.spacing.xs};
      }

      .cds-stepper__number {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: ${t.colors.neutral[200]};
        color: ${t.colors.neutral[500]};
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: ${t.typography.fontWeight.medium};
        font-size: ${t.typography.fontSize.sm};
      }

      .cds-stepper__step--completed .cds-stepper__number {
        background-color: ${t.colors.success[600]};
        color: var(--color-action-text);
      }

      .cds-stepper__step--active .cds-stepper__number {
        background-color: ${t.colors.primary[600]};
        color: var(--color-action-text);
      }

      .cds-stepper__step--error .cds-stepper__number {
        background-color: ${t.colors.error[600]};
        color: var(--color-action-text);
      }

      .cds-stepper__step--blocked .cds-stepper__number {
        background-color: ${t.colors.warning[600]};
        color: var(--color-action-text);
      }

      .cds-stepper__label {
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[600]};
      }

      .cds-stepper__step--active .cds-stepper__label {
        color: ${t.colors.primary[600]};
        font-weight: ${t.typography.fontWeight.medium};
      }

      .cds-stepper__step--error .cds-stepper__label {
        color: ${t.colors.error[600]};
      }

      .cds-stepper__step--blocked .cds-stepper__label {
        color: ${t.colors.warning[600]};
      }

      .cds-stepper__connector {
        flex: 1;
        height: 2px;
        background-color: ${t.colors.neutral[200]};
      }

      .cds-stepper__step--completed + .cds-stepper__connector {
        background-color: ${t.colors.success[600]};
      }
    `;
  }
}

module.exports = Stepper;
