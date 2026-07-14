/**
 * CDSToast — Notificação toast oficial
 *
 * @module frontend/shared/design-system/components/feedback/CDSToast
 */

const theme = require('../../theme');

class CDSToast {
  static create(options = {}) {
    const { message = '', variant = 'info', onClose = null } = options;
    const toast = document.createElement('div');
    toast.className = `cds-toast cds-toast--${variant}`;
    toast.setAttribute('role', 'alert');

    const text = document.createElement('span');
    text.className = 'cds-toast__message';
    text.textContent = message;
    toast.appendChild(text);

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'cds-toast__close';
    close.textContent = '×';
    close.setAttribute('aria-label', 'Fechar');
    close.addEventListener('click', () => {
      toast.remove();
      if (onClose) onClose();
    });
    toast.appendChild(close);

    return toast;
  }

  static show(message, variant = 'info', duration = 4000) {
    let container = document.getElementById('cds-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'cds-toast-container';
      container.className = 'cds-toast-container';
      document.body.appendChild(container);
    }
    const toast = CDSToast.create({
      message,
      variant,
      onClose: () => toast.remove()
    });
    container.appendChild(toast);
    if (duration > 0) {
      setTimeout(() => toast.remove(), duration);
    }
    return toast;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-toast-container {
        position: fixed; top: ${t.spacing.lg}; right: ${t.spacing.lg};
        z-index: ${t.zindex.notification}; display: flex; flex-direction: column; gap: ${t.spacing.sm};
        max-width: 400px;
      }
      .cds-toast {
        display: flex; align-items: center; justify-content: space-between; gap: ${t.spacing.md};
        padding: ${t.spacing.md}; border-radius: ${t.radius.md}; box-shadow: ${t.shadow.lg};
        background: var(--color-surface); border-left: 4px solid ${t.colors.primary[500]};
        animation: cds-toast-in 0.2s ease-out;
      }
      .cds-toast--success { border-left-color: ${t.colors.success[500]}; }
      .cds-toast--error { border-left-color: ${t.colors.error[500]}; }
      .cds-toast--warning { border-left-color: ${t.colors.warning[500]}; }
      .cds-toast__close { border: none; background: none; font-size: 20px; cursor: pointer; color: ${t.colors.neutral[500]}; }
      @keyframes cds-toast-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
    `;
  }
}

module.exports = CDSToast;
