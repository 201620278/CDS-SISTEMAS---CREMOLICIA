/**
 * Tag — Base Tag Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Tag.
 *
 * @module frontend/modules/motor-comercial/components/base/Tag
 */

const theme = require('../../theme');

class Tag {
  /**
   * Creates a tag element.
   * @param {Object} options
   * @param {string} options.text - Tag text
   * @param {boolean} [options.removable=false] - Removable
   * @param {Function} [options.onRemove] - Remove handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      text = '',
      removable = false,
      onRemove = null
    } = options;

    const tag = document.createElement('div');
    tag.className = 'cds-tag';

    const textEl = document.createElement('span');
    textEl.className = 'cds-tag__text';
    textEl.textContent = text;
    tag.appendChild(textEl);

    if (removable) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'cds-tag__remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.setAttribute('aria-label', 'Remove tag');
      
      if (onRemove) {
        removeBtn.addEventListener('click', onRemove);
      }
      
      tag.appendChild(removeBtn);
    }

    return tag;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-tag {
        display: inline-flex;
        align-items: center;
        gap: ${t.spacing.xs};
        padding: ${t.spacing.xs} ${t.spacing.sm};
        background-color: ${t.colors.primary[50]};
        color: ${t.colors.primary[700]};
        border-radius: ${t.radius.sm};
        font-size: ${t.typography.fontSize.sm};
        font-weight: ${t.typography.fontWeight.medium};
      }

      .cds-tag__remove {
        background: none;
        border: none;
        font-size: ${t.typography.fontSize.lg};
        cursor: pointer;
        color: inherit;
        opacity: 0.6;
        padding: 0;
        line-height: 1;
      }

      .cds-tag__remove:hover {
        opacity: 1;
      }
    `;
  }
}

module.exports = Tag;
