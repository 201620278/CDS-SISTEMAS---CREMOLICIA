/**
 * Avatar — Base Avatar Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Avatar.
 *
 * @module frontend/modules/motor-comercial/components/base/Avatar
 */

const theme = require('../../theme');

class Avatar {
  /**
   * Creates an avatar element.
   * @param {Object} options
   * @param {string} [options.name] - Name for initials
   * @param {string} [options.src] - Image source
   * @param {string} [options.alt] - Alt text
   * @param {string} [options.size='md'] - Size (xs, sm, md, lg, xl)
   * @param {string} [options.variant='circle'] - Variant (circle, square)
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      name = '',
      src = null,
      alt = '',
      size = 'md',
      variant = 'circle'
    } = options;

    const avatar = document.createElement('div');
    avatar.className = this._getClasses(size, variant);

    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = alt || name;
      img.className = 'cds-avatar__image';
      avatar.appendChild(img);
    } else if (name) {
      const initials = this._getInitials(name);
      const initialsEl = document.createElement('span');
      initialsEl.className = 'cds-avatar__initials';
      initialsEl.textContent = initials;
      avatar.appendChild(initialsEl);
    }

    return avatar;
  }

  /**
   * Gets CSS classes for avatar.
   * @private
   */
  static _getClasses(size, variant) {
    return `cds-avatar cds-avatar--${size} cds-avatar--${variant}`;
  }

  /**
   * Gets initials from name.
   * @private
   */
  static _getInitials(name) {
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-avatar {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background-color: ${t.colors.primary[600]};
        color: var(--color-text-inverse);
        font-weight: ${t.typography.fontWeight.medium};
        overflow: hidden;
      }

      .cds-avatar--circle {
        border-radius: 50%;
      }

      .cds-avatar--square {
        border-radius: ${t.radius.md};
      }

      .cds-avatar--xs {
        width: 24px;
        height: 24px;
        font-size: ${t.typography.fontSize.xs};
      }

      .cds-avatar--sm {
        width: 32px;
        height: 32px;
        font-size: ${t.typography.fontSize.sm};
      }

      .cds-avatar--md {
        width: 40px;
        height: 40px;
        font-size: ${t.typography.fontSize.base};
      }

      .cds-avatar--lg {
        width: 48px;
        height: 48px;
        font-size: ${t.typography.fontSize.lg};
      }

      .cds-avatar--xl {
        width: 64px;
        height: 64px;
        font-size: ${t.typography.fontSize.xl};
      }

      .cds-avatar__image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cds-avatar__initials {
        text-transform: uppercase;
      }
    `;
  }
}

module.exports = Avatar;
