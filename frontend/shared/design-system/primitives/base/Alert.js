/**
 * Alert — Base Alert Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Alert.
 *
 * @module frontend/modules/motor-comercial/components/base/Alert
 */

const theme = require('../../theme');

class Alert {
  /**
   * Creates an alert element.
   * @param {Object} options
   * @param {string} options.message - Alert message
   * @param {string} [options.variant='info'] - Variant (info, success, warning, error)
   * @param {boolean} [options.dismissible=false] - Dismissible
   * @param {Function} [options.onDismiss] - Dismiss handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      message = '',
      variant = 'info',
      dismissible = false,
      onDismiss = null
    } = options;

    const alert = document.createElement('div');
    alert.className = this._getClasses(variant);
    alert.setAttribute('role', 'alert');

    const icon = document.createElement('span');
    icon.className = `cds-alert__icon cds-alert__icon--${variant}`;
    icon.innerHTML = this._getIcon(variant);
    alert.appendChild(icon);

    const content = document.createElement('div');
    content.className = 'cds-alert__content';
    content.textContent = message;
    alert.appendChild(content);

    if (dismissible) {
      const dismissBtn = document.createElement('button');
      dismissBtn.className = 'cds-alert__dismiss';
      dismissBtn.innerHTML = '&times;';
      dismissBtn.setAttribute('aria-label', 'Close');
      
      if (onDismiss) {
        dismissBtn.addEventListener('click', onDismiss);
      }
      
      alert.appendChild(dismissBtn);
    }

    return alert;
  }

  /**
   * Gets CSS classes for alert.
   * @private
   */
  static _getClasses(variant) {
    return `cds-alert cds-alert--${variant}`;
  }

  /**
   * Gets icon for variant.
   * @private
   */
  static _getIcon(variant) {
    const icons = {
      info: 'ℹ️',
      success: '✓',
      warning: '⚠',
      error: '✕'
    };
    return icons[variant] || icons.info;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-alert {
        display: flex;
        align-items: flex-start;
        gap: ${t.spacing.sm};
        padding: ${t.spacing.md};
        border-radius: ${t.radius.md};
        margin-bottom: ${t.spacing.md};
      }

      .cds-alert--info {
        background-color: ${t.colors.primary[50]};
        color: ${t.colors.primary[700]};
        border: 1px solid ${t.colors.primary[200]};
      }

      .cds-alert--success {
        background-color: ${t.colors.success[50]};
        color: ${t.colors.success[700]};
        border: 1px solid ${t.colors.success[200]};
      }

      .cds-alert--warning {
        background-color: ${t.colors.warning[50]};
        color: ${t.colors.warning[700]};
        border: 1px solid ${t.colors.warning[200]};
      }

      .cds-alert--error {
        background-color: ${t.colors.error[50]};
        color: ${t.colors.error[700]};
        border: 1px solid ${t.colors.error[200]};
      }

      .cds-alert__icon {
        font-size: ${t.typography.fontSize.lg};
        flex-shrink: 0;
      }

      .cds-alert__content {
        flex: 1;
        font-size: ${t.typography.fontSize.sm};
      }

      .cds-alert__dismiss {
        background: none;
        border: none;
        font-size: ${t.typography.fontSize.xl};
        cursor: pointer;
        color: inherit;
        opacity: 0.6;
        padding: 0;
        line-height: 1;
      }

      .cds-alert__dismiss:hover {
        opacity: 1;
      }
    `;
  }
}

module.exports = Alert;
