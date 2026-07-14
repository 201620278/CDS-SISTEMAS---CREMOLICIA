/**
 * useToast — Toast Notification Hook
 *
 * Sprint 2.7: Arquitetura Frontend — hook de toasts.
 *
 * @module frontend/modules/motor-comercial/hooks/useToast
 */

class useToast {
  /**
   * Creates a toast manager.
   * @returns {Object}
   */
  static create() {
    const toasts = [];
    const listeners = new Set();

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    const notify = () => {
      listeners.forEach(listener => listener([...toasts]));
    };

    const add = (message, options = {}) => {
      const toast = {
        id: Date.now(),
        message,
        variant: options.variant || 'info',
        duration: options.duration || 5000,
        dismissible: options.dismissible !== false
      };

      toasts.push(toast);
      notify();

      if (toast.duration > 0) {
        setTimeout(() => remove(toast.id), toast.duration);
      }

      return toast.id;
    };

    const remove = (id) => {
      const index = toasts.findIndex(t => t.id === id);
      if (index !== -1) {
        toasts.splice(index, 1);
        notify();
      }
    };

    const clear = () => {
      toasts.length = 0;
      notify();
    };

    const success = (message, options) => add(message, { ...options, variant: 'success' });
    const error = (message, options) => add(message, { ...options, variant: 'error' });
    const warning = (message, options) => add(message, { ...options, variant: 'warning' });
    const info = (message, options) => add(message, { ...options, variant: 'info' });

    return {
      get toasts() {
        return [...toasts];
      },
      add,
      remove,
      clear,
      success,
      error,
      warning,
      info,
      subscribe
    };
  }
}

module.exports = useToast;
