/**
 * Progress — Data Progress Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Progress.
 *
 * @module frontend/modules/motor-comercial/components/data/Progress
 */

const theme = require('../../theme');

class Progress {
  /**
   * Creates a progress element.
   * @param {Object} options
   * @param {number} options.value - Progress value (0-100)
   * @param {string} [options.label] - Label
   * @param {string} [options.color='primary'] - Color (primary, success, warning, error)
   * @param {boolean} [options.showValue=false] - Show percentage
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      value = 0,
      label = '',
      color = 'primary',
      showValue = false
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-progress-group';

    if (label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'cds-progress__label';
      
      const labelText = document.createElement('span');
      labelText.textContent = label;
      labelEl.appendChild(labelText);

      if (showValue) {
        const valueText = document.createElement('span');
        valueText.className = 'cds-progress__value';
        valueText.textContent = `${value}%`;
        labelEl.appendChild(valueText);
      }

      container.appendChild(labelEl);
    }

    const progressContainer = document.createElement('div');
    progressContainer.className = 'cds-progress__container';

    const progressBar = document.createElement('div');
    progressBar.className = `cds-progress__bar cds-progress__bar--${color}`;
    progressBar.style.width = `${Math.min(100, Math.max(0, value))}%`;

    progressContainer.appendChild(progressBar);
    container.appendChild(progressContainer);

    return container;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-progress-group {
        margin-bottom: ${t.spacing.md};
      }

      .cds-progress__label {
        display: flex;
        justify-content: space-between;
        margin-bottom: ${t.spacing.xs};
        font-size: ${t.typography.fontSize.sm};
        font-weight: ${t.typography.fontWeight.medium};
        color: ${t.colors.neutral[700]};
      }

      .cds-progress__value {
        font-weight: ${t.typography.fontWeight.semibold};
      }

      .cds-progress__container {
        width: 100%;
        height: 8px;
        background-color: ${t.colors.neutral[200]};
        border-radius: ${t.radius.full};
        overflow: hidden;
      }

      .cds-progress__bar {
        height: 100%;
        border-radius: ${t.radius.full};
        transition: width ${t.animations.duration.normal} ${t.animations.easing.easeInOut};
      }

      .cds-progress__bar--primary {
        background-color: ${t.colors.primary[600]};
      }

      .cds-progress__bar--success {
        background-color: ${t.colors.success[600]};
      }

      .cds-progress__bar--warning {
        background-color: ${t.colors.warning[600]};
      }

      .cds-progress__bar--error {
        background-color: ${t.colors.error[600]};
      }
    `;
  }
}

module.exports = Progress;
