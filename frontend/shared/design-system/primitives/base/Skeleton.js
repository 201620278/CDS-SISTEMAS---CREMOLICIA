/**
 * Skeleton — Base Skeleton Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Skeleton.
 *
 * @module frontend/modules/motor-comercial/components/base/Skeleton
 */

const theme = require('../../theme');

class Skeleton {
  /**
   * Creates a skeleton element.
   * @param {Object} options
   * @param {string} [options.variant='text'] - Variant (text, circle, rect)
   * @param {string} [options.width] - Width
   * @param {string} [options.height] - Height
   * @param {boolean} [options.animate=true] - Animate
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      variant = 'text',
      width = null,
      height = null,
      animate = true
    } = options;

    const skeleton = document.createElement('div');
    skeleton.className = this._getClasses(variant, animate);

    if (width) skeleton.style.width = width;
    if (height) skeleton.style.height = height;

    return skeleton;
  }

  /**
   * Gets CSS classes for skeleton.
   * @private
   */
  static _getClasses(variant, animate) {
    const classes = ['cds-skeleton'];
    classes.push(`cds-skeleton--${variant}`);
    if (animate) classes.push('cds-skeleton--animate');
    return classes.join(' ');
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-skeleton {
        background-color: ${t.colors.neutral[200]};
        border-radius: ${t.radius.sm};
      }

      .cds-skeleton--text {
        height: 1em;
        width: 100%;
      }

      .cds-skeleton--circle {
        border-radius: 50%;
      }

      .cds-skeleton--rect {
        border-radius: ${t.radius.md};
      }

      .cds-skeleton--animate {
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }

      @keyframes skeleton-pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `;
  }
}

module.exports = Skeleton;
