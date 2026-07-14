/**
 * Switch — Form Switch Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Switch.
 *
 * @module frontend/modules/motor-comercial/components/form/Switch
 */

const theme = require('../../theme');

class Switch {
  /**
   * Creates a switch element.
   * @param {Object} options
   * @param {string} options.label - Label
   * @param {boolean} [options.checked=false] - Checked state
   * @param {boolean} [options.disabled=false] - Disabled
   * @param {Function} [options.onChange] - Change handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      label = '',
      checked = false,
      disabled = false,
      onChange = null
    } = options;

    const container = document.createElement('label');
    container.className = 'cds-switch';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.disabled = disabled;
    input.className = 'cds-switch__input';

    if (onChange && !disabled) {
      input.addEventListener('change', (e) => onChange(e.target.checked));
    }

    const track = document.createElement('span');
    track.className = 'cds-switch__track';

    const thumb = document.createElement('span');
    thumb.className = 'cds-switch__thumb';

    track.appendChild(thumb);

    const labelEl = document.createElement('span');
    labelEl.className = 'cds-switch__label';
    labelEl.textContent = label;

    container.appendChild(input);
    container.appendChild(track);
    container.appendChild(labelEl);

    return container;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-switch {
        display: inline-flex;
        align-items: center;
        gap: ${t.spacing.sm};
        cursor: pointer;
        user-select: none;
      }

      .cds-switch__input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
      }

      .cds-switch__track {
        position: relative;
        width: 44px;
        height: 24px;
        background-color: ${t.colors.neutral[300]};
        border-radius: ${t.radius.full};
        transition: background-color ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-switch__input:checked + .cds-switch__track {
        background-color: ${t.colors.primary[600]};
      }

      .cds-switch__input:disabled + .cds-switch__track {
        background-color: ${t.colors.neutral[200]};
        cursor: not-allowed;
      }

      .cds-switch__thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background-color: var(--color-surface);
        border-radius: 50%;
        box-shadow: ${t.shadow.xs};
        transition: transform ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-switch__input:checked + .cds-switch__track .cds-switch__thumb {
        transform: translateX(20px);
      }

      .cds-switch__input:disabled + .cds-switch__track .cds-switch__thumb {
        background-color: ${t.colors.neutral[400]};
      }

      .cds-switch__label {
        font-size: ${t.typography.fontSize.base};
        color: ${t.colors.neutral[700]};
      }

      .cds-switch__input:disabled ~ .cds-switch__label {
        opacity: 0.6;
      }
    `;
  }
}

module.exports = Switch;
