/**
 * useConfirm — Confirmation Dialog Hook
 *
 * Sprint 2.7: Arquitetura Frontend — hook de confirmação.
 *
 * @module frontend/modules/motor-comercial/hooks/useConfirm
 */

class useConfirm {
  /**
   * Creates a confirmation manager.
   * @returns {Object}
   */
  static create() {
    let confirmState = {
      open: false,
      title: '',
      message: '',
      onConfirm: null,
      onCancel: null
    };
    const listeners = new Set();

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    const notify = () => {
      listeners.forEach(listener => listener({ ...confirmState }));
    };

    const confirm = (options) => {
      return new Promise((resolve) => {
        confirmState = {
          open: true,
          title: options.title || 'Confirmação',
          message: options.message || 'Tem certeza?',
          onConfirm: () => {
            confirmState.open = false;
            notify();
            resolve(true);
          },
          onCancel: () => {
            confirmState.open = false;
            notify();
            resolve(false);
          }
        };
        notify();
      });
    };

    const handleConfirm = () => {
      if (confirmState.onConfirm) {
        confirmState.onConfirm();
      }
    };

    const handleCancel = () => {
      if (confirmState.onCancel) {
        confirmState.onCancel();
      }
    };

    const close = () => {
      confirmState.open = false;
      confirmState.onConfirm = null;
      confirmState.onCancel = null;
      notify();
    };

    return {
      get isOpen() {
        return confirmState.open;
      },
      get title() {
        return confirmState.title;
      },
      get message() {
        return confirmState.message;
      },
      confirm,
      handleConfirm,
      handleCancel,
      close,
      subscribe
    };
  }
}

module.exports = useConfirm;
