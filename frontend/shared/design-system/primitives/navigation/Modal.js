/**
 * Modal — Navigation Modal Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Modal.
 *
 * @module frontend/modules/motor-comercial/components/navigation/Modal
 */

const theme = require('../../theme');

class Modal {
  /**
   * Creates a modal element.
   * @param {Object} options
   * @param {string} options.title - Modal title
   * @param {HTMLElement} options.content - Modal content
   * @param {HTMLElement} [options.footer] - Modal footer
   * @param {boolean} [options.open=false] - Open state
   * @param {Function} [options.onClose] - Close handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      title = '',
      content = null,
      footer = null,
      open = false,
      onClose = null
    } = options;

    const backdrop = document.createElement('div');
    backdrop.className = `cds-modal-backdrop ${open ? 'cds-modal-backdrop--open is-open' : ''}`;

    const modal = document.createElement('div');
    modal.className = 'cds-modal';

    const header = document.createElement('div');
    header.className = 'cds-modal__header';

    const titleEl = document.createElement('h2');
    titleEl.className = 'cds-modal__title';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'cds-modal__close';
    closeBtn.innerHTML = '&times;';
    closeBtn.setAttribute('aria-label', 'Close');
    
    if (onClose) {
      closeBtn.addEventListener('click', onClose);
    }
    
    header.appendChild(closeBtn);

    modal.appendChild(header);

    const body = document.createElement('div');
    body.className = 'cds-modal__body';
    if (content) body.appendChild(content);
    modal.appendChild(body);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'cds-modal__footer';
      footerEl.appendChild(footer);
      modal.appendChild(footerEl);
    }

    backdrop.appendChild(modal);

    if (onClose) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) onClose();
      });
    }

    return backdrop;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-modal-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${t.zindex.modalBackdrop};
        opacity: 0;
        visibility: hidden;
        transition: all ${t.animations.duration.normal} ${t.animations.easing.easeInOut};
      }

      .cds-modal-backdrop--open,
      .cds-modal-backdrop.is-open {
        opacity: 1;
        visibility: visible;
      }

      .cds-modal {
        background-color: var(--color-surface);
        border-radius: ${t.radius.lg};
        box-shadow: ${t.shadow.xl};
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        opacity: 0;
        transform: scale(0.9);
        transition: transform ${t.animations.duration.normal} ${t.animations.easing.easeInOut},
          opacity ${t.animations.duration.normal} ${t.animations.easing.easeInOut};
      }

      .cds-modal-backdrop--open .cds-modal,
      .cds-modal-backdrop.is-open .cds-modal {
        opacity: 1;
        transform: scale(1);
      }

      .cds-modal__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: ${t.spacing.lg};
        border-bottom: 1px solid ${t.colors.neutral[200]};
      }

      .cds-modal__title {
        margin: 0;
        font-size: ${t.typography.fontSize.xl};
        font-weight: ${t.typography.fontWeight.semibold};
        color: ${t.colors.neutral[900]};
      }

      .cds-modal__close {
        background: none;
        border: none;
        font-size: ${t.typography.fontSize['2xl']};
        cursor: pointer;
        color: ${t.colors.neutral[500]};
        padding: 0;
        line-height: 1;
      }

      .cds-modal__close:hover {
        color: ${t.colors.neutral[700]};
      }

      .cds-modal__body {
        padding: ${t.spacing.lg};
        overflow-y: auto;
      }

      .cds-modal__footer {
        padding: ${t.spacing.lg};
        border-top: 1px solid ${t.colors.neutral[200]};
        display: flex;
        justify-content: flex-end;
        gap: ${t.spacing.sm};
      }
    `;
  }
}

module.exports = Modal;
