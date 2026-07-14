/**
 * ModalContext — Modal Context Provider
 *
 * Sprint 2.7: Arquitetura Frontend — contexto de modais.
 *
 * @module frontend/modules/motor-comercial/contexts/ModalContext
 */

class ModalContext {
  constructor() {
    this._modals = new Map();
    this._listeners = new Set();
  }

  /**
   * Gets current modals.
   * @returns {Array}
   */
  getModals() {
    return Array.from(this._modals.values());
  }

  /**
   * Subscribes to modal changes.
   * @param {Function} listener - Listener function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Opens a modal.
   * @param {string} id - Modal ID
   * @param {Object} options - Modal options
   */
  open(id, options = {}) {
    this._modals.set(id, {
      id,
      open: true,
      ...options
    });
    this._notify();
  }

  /**
   * Closes a modal.
   * @param {string} id - Modal ID
   */
  close(id) {
    const modal = this._modals.get(id);
    if (modal) {
      modal.open = false;
      this._notify();
      
      setTimeout(() => {
        this._modals.delete(id);
        this._notify();
      }, 300);
    }
  }

  /**
   * Checks if modal is open.
   * @param {string} id - Modal ID
   * @returns {boolean}
   */
  isOpen(id) {
    const modal = this._modals.get(id);
    return modal ? modal.open : false;
  }

  /**
   * Notifies listeners.
   * @private
   */
  _notify() {
    this._listeners.forEach(listener => listener(this.getModals()));
  }
}

// Singleton instance
const modalContext = new ModalContext();

module.exports = modalContext;
