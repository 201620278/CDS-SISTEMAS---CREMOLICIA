/**
 * CDSConfirmDialog — Diálogo de confirmação oficial
 *
 * @module frontend/shared/design-system/components/feedback/CDSConfirmDialog
 */

const Modal = require('../../primitives/navigation/Modal');
const CDSPrimaryButton = require('../buttons/CDSPrimaryButton');
const CDSSecondaryButton = require('../buttons/CDSSecondaryButton');
const theme = require('../../theme');

class CDSConfirmDialog {
  /**
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.message
   * @param {string} [options.confirmLabel]
   * @param {string} [options.cancelLabel]
   * @param {string} [options.variant]
   * @param {Function} [options.onConfirm]
   * @param {Function} [options.onCancel]
   */
  static create(options = {}) {
    const {
      title = 'Confirmar',
      message = '',
      confirmLabel = 'Confirmar',
      cancelLabel = 'Cancelar',
      variant = 'primary',
      onConfirm = null,
      onCancel = null
    } = options;

    const body = document.createElement('div');
    body.className = 'cds-confirm-dialog';
    body.innerHTML = `<p class="cds-confirm-dialog__message">${message}</p>`;

    const actions = document.createElement('div');
    actions.className = 'cds-confirm-dialog__actions';

    const close = () => modal.close();

    actions.appendChild(CDSSecondaryButton.create({
      text: cancelLabel,
      onClick: () => { close(); if (onCancel) onCancel(); }
    }));

    const ConfirmBtn = variant === 'danger'
      ? require('../buttons/CDSDangerButton')
      : CDSPrimaryButton;

    actions.appendChild(ConfirmBtn.create({
      text: confirmLabel,
      onClick: () => { close(); if (onConfirm) onConfirm(); }
    }));

    body.appendChild(actions);

    const modal = Modal.create({ title, content: body, size: 'sm' });
    return modal;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-confirm-dialog__message { margin: 0 0 ${t.spacing.lg}; color: ${t.colors.neutral[700]}; }
      .cds-confirm-dialog__actions { display: flex; justify-content: flex-end; gap: ${t.spacing.sm}; }
    `;
  }
}

module.exports = CDSConfirmDialog;
