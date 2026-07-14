/**
 * LoadingContext — Loading Context Provider
 *
 * Sprint 2.7: Arquitetura Frontend — contexto de loading.
 *
 * @module frontend/modules/motor-comercial/contexts/LoadingContext
 */

class LoadingContext {
  constructor() {
    this._loading = false;
    this._message = '';
    this._listeners = new Set();
  }

  /**
   * Gets current loading state.
   * @returns {Object}
   */
  getState() {
    return {
      loading: this._loading,
      message: this._message
    };
  }

  /**
   * Subscribes to loading changes.
   * @param {Function} listener - Listener function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Sets loading state.
   * @param {boolean} loading - Loading state
   * @param {string} [message] - Loading message
   */
  setLoading(loading, message = '') {
    this._loading = loading;
    this._message = message;
    this._notify();
  }

  /**
   * Starts loading.
   * @param {string} [message] - Loading message
   */
  start(message = '') {
    this.setLoading(true, message);
  }

  /**
   * Stops loading.
   */
  stop() {
    this.setLoading(false, '');
  }

  /**
   * Notifies listeners.
   * @private
   */
  _notify() {
    this._listeners.forEach(listener => listener(this.getState()));
  }
}

// Singleton instance
const loadingContext = new LoadingContext();

module.exports = loadingContext;
