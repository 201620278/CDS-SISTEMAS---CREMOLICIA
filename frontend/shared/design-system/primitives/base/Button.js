/**
 * Button — Base Button Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Button.
 *
 * @module frontend/modules/motor-comercial/components/base/Button
 */

const theme = require('../../theme');

class Button {
  /**
   * Creates a button element.
   * @param {Object} options
   * @param {string} [options.text] - Button text
   * @param {string} [options.variant='primary'] - Variant (primary, secondary, danger, success, ghost)
   * @param {string} [options.size='md'] - Size (sm, md, lg)
   * @param {boolean} [options.disabled=false] - Disabled state
   * @param {boolean} [options.loading=false] - Loading state
   * @param {boolean} [options.fullWidth=false] - Full width
   * @param {string} [options.icon] - Icon class
   * @param {Function} [options.onClick] - Click handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      text = '',
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      fullWidth = false,
      icon = null,
      onClick = null
    } = options;

    const button = document.createElement('button');
    button.className = this._getClasses(variant, size, disabled, loading, fullWidth);
    button.disabled = disabled || loading;
    button.setAttribute('type', 'button');

    if (icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = `button-icon ${icon}`;
      button.appendChild(iconSpan);
    }

    if (text) {
      const textSpan = document.createElement('span');
      textSpan.className = 'button-text';
      textSpan.textContent = text;
      button.appendChild(textSpan);
    }

    if (loading) {
      const loader = document.createElement('span');
      loader.className = 'button-loader';
      loader.innerHTML = '<span class="spinner"></span>';
      button.appendChild(loader);
    }

    if (onClick && !disabled) {
      button.addEventListener('click', onClick);
    }

    return button;
  }

  /**
   * Gets CSS classes for button.
   * @private
   */
  static _getClasses(variant, size, disabled, loading, fullWidth) {
    const classes = ['cds-button'];

    // Variant
    classes.push(`cds-button--${variant}`);

    // Size
    classes.push(`cds-button--${size}`);

    // States
    if (disabled) classes.push('cds-button--disabled');
    if (loading) classes.push('cds-button--loading');
    if (fullWidth) classes.push('cds-button--full-width');

    return classes.join(' ');
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: ${t.spacing.sm};
        padding: ${t.spacing.sm} ${t.spacing.md};
        border: none;
        border-radius: ${t.radius.md};
        font-family: ${t.typography.fontFamily.primary};
        font-size: ${t.typography.fontSize.base};
        font-weight: ${t.typography.fontWeight.medium};
        cursor: pointer;
        transition: all ${t.animations.duration.normal} ${t.animations.easing.easeInOut};
        white-space: nowrap;
      }

      .cds-button--primary {
        background-color: ${t.components.button.primary.backgroundColor};
        color: ${t.components.button.primary.color};
      }

      .cds-button--primary:hover:not(:disabled) {
        background-color: ${t.components.button.primary.hoverBackgroundColor};
      }

      .cds-button--secondary {
        background-color: ${t.components.button.secondary.backgroundColor};
        color: ${t.components.button.secondary.color};
      }

      .cds-button--secondary:hover:not(:disabled) {
        background-color: ${t.components.button.secondary.hoverBackgroundColor};
      }

      .cds-button--danger {
        background-color: ${t.components.button.danger.backgroundColor};
        color: ${t.components.button.danger.color};
      }

      .cds-button--danger:hover:not(:disabled) {
        background-color: ${t.components.button.danger.hoverBackgroundColor};
      }

      .cds-button--success {
        background-color: ${t.components.button.success.backgroundColor};
        color: ${t.components.button.success.color};
      }

      .cds-button--success:hover:not(:disabled) {
        background-color: ${t.components.button.success.hoverBackgroundColor};
      }

      .cds-button--ghost {
        background-color: transparent;
        color: ${t.colors.primary[600]};
        border: 1px solid ${t.colors.primary[600]};
      }

      .cds-button--ghost:hover:not(:disabled) {
        background-color: ${t.colors.primary[50]};
      }

      .cds-button--sm {
        padding: ${t.spacing.xs} ${t.spacing.sm};
        font-size: ${t.typography.fontSize.sm};
      }

      .cds-button--lg {
        padding: ${t.spacing.md} ${t.spacing.lg};
        font-size: ${t.typography.fontSize.lg};
      }

      .cds-button--disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .cds-button--loading {
        opacity: 0.8;
        cursor: wait;
      }

      .cds-button--full-width {
        width: 100%;
      }

      .button-loader {
        display: inline-flex;
        align-items: center;
      }

      .spinner {
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
  }
}

module.exports = Button;
