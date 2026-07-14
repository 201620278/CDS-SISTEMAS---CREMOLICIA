/**
 * Badge — Base Badge Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Badge.
 *
 * @module frontend/modules/motor-comercial/components/base/Badge
 */

const theme = require('../../theme');

class Badge {
  /**
   * Creates a badge element.
   * @param {Object} options
   * @param {string} options.text - Badge text
   * @param {string} [options.variant='default'] - Variant (default, success, warning, error, info)
   * @param {string} [options.size='md'] - Size (sm, md, lg)
   * @param {boolean} [options.dot=false] - Dot style
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      text = '',
      variant = 'default',
      size = 'md',
      dot = false
    } = options;

    const badge = document.createElement('span');
    badge.className = this._getClasses(variant, size, dot);

    if (dot) {
      const dot = document.createElement('span');
      dot.className = 'cds-badge__dot';
      badge.appendChild(dot);
    } else {
      badge.textContent = text;
    }

    return badge;
  }

  /**
   * Gets CSS classes for badge.
   * @private
   */
  static _getClasses(variant, size, dot) {
    const classes = ['cds-badge'];

    classes.push(`cds-badge--${variant}`);
    classes.push(`cds-badge--${size}`);

    if (dot) classes.push('cds-badge--dot');

    return classes.join(' ');
  }

  /**
   * Creates status badge.
   * @param {string} status - Status (active, inactive, pending, blocked, draft, completed, cancelled)
   * @returns {HTMLElement}
   */
  static createStatus(status) {
    const variantMap = {
      active: 'success',
      inactive: 'default',
      pending: 'warning',
      blocked: 'error',
      draft: 'info',
      completed: 'success',
      cancelled: 'error'
    };

    const variant = variantMap[status] || 'default';
    return this.create({ text: status, variant });
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-badge {
        display: inline-flex;
        align-items: center;
        padding: ${t.spacing.xs} ${t.spacing.sm};
        border-radius: ${t.radius.full};
        font-size: ${t.typography.fontSize.xs};
        font-weight: ${t.typography.fontWeight.medium};
        text-transform: uppercase;
        letter-spacing: ${t.typography.letterSpacing.wide};
      }

      .cds-badge--default {
        background-color: ${t.colors.neutral[100]};
        color: ${t.colors.neutral[700]};
      }

      .cds-badge--success {
        background-color: ${t.components.badge.success.backgroundColor};
        color: ${t.components.badge.success.color};
      }

      .cds-badge--warning {
        background-color: ${t.components.badge.warning.backgroundColor};
        color: ${t.components.badge.warning.color};
      }

      .cds-badge--error {
        background-color: ${t.components.badge.error.backgroundColor};
        color: ${t.components.badge.error.color};
      }

      .cds-badge--info {
        background-color: ${t.components.badge.info.backgroundColor};
        color: ${t.components.badge.info.color};
      }

      .cds-badge--sm {
        font-size: 10px;
        padding: 2px 6px;
      }

      .cds-badge--lg {
        font-size: ${t.typography.fontSize.sm};
        padding: ${t.spacing.sm} ${t.spacing.md};
      }

      .cds-badge--dot {
        padding: 0;
        width: 8px;
        height: 8px;
      }

      .cds-badge__dot {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: currentColor;
      }
    `;
  }
}

module.exports = Badge;
