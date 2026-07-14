/**
 * ToastContext — Toast Context Provider
 *
 * Sprint 2.7: Arquitetura Frontend — contexto de toasts.
 *
 * @module frontend/modules/motor-comercial/contexts/ToastContext
 */

class ToastContext {
  constructor() {
    this._toasts = [];
    this._listeners = new Set();
  }

  /**
   * Gets current toasts.
   * @returns {Array}
   */
  getToasts() {
    return [...this._toasts];
  }

  /**
   * Subscribes to toast changes.
   * @param {Function} listener - Listener function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Adds a toast.
   * @param {string} message - Toast message
   * @param {Object} options - Toast options
   * @returns {number} - Toast ID
   */
  add(message, options = {}) {
    const toast = {
      id: Date.now(),
      message,
      variant: options.variant || 'info',
      duration: options.duration || 5000,
      dismissible: options.dismissible !== false
    };

    this._toasts.push(toast);
    this._notify();

    if (toast.duration > 0) {
      setTimeout(() => this.remove(toast.id), toast.duration);
    }

    return toast.id;
  }

  /**
   * Removes a toast.
   * @param {number} id - Toast ID
   */
  remove(id) {
    const index = this._toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      this._toasts.splice(index, 1);
      this._notify();
    }
  }

  /**
   * Clears all toasts.
   */
  clear() {
    this._toasts.length = 0;
    this._notify();
  }

  /**
   * Success toast.
   */
  success(message, options) {
    return this.add(message, { ...options, variant: 'success' });
  }

  /**
   * Error toast.
   */
  error(message, options) {
    return this.add(message, { ...options, variant: 'error' });
  }

  /**
   * Warning toast.
   */
  warning(message, options) {
    return this.add(message, { ...options, variant: 'warning' });
  }

  /**
   * Info toast.
   */
  info(message, options) {
    return this.add(message, { ...options, variant: 'info' });
  }

  /**
   * Notifies listeners.
   * @private
   */
  _notify() {
    this._listeners.forEach(listener => listener([...this._toasts]));
  }
}

// Singleton instance
const toastContext = new ToastContext();

module.exports = toastContext;
