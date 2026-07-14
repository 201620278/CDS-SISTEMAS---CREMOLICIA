/**
 * UserContext — User Context Provider
 *
 * Sprint 2.7: Arquitetura Frontend — contexto de usuário.
 *
 * @module frontend/modules/motor-comercial/contexts/UserContext
 */

class UserContext {
  constructor() {
    this._user = null;
    this._listeners = new Set();
  }

  /**
   * Gets current user.
   * @returns {Object|null}
   */
  getUser() {
    return this._user;
  }

  /**
   * Checks if user is authenticated.
   * @returns {boolean}
   */
  isAuthenticated() {
    return this._user !== null;
  }

  /**
   * Subscribes to user changes.
   * @param {Function} listener - Listener function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Sets user.
   * @param {Object} user - User data
   */
  setUser(user) {
    this._user = user;
    this._notify();
  }

  /**
   * Clears user (logout).
   */
  clearUser() {
    this._user = null;
    this._notify();
  }

  /**
   * Updates user data.
   * @param {Object} updates - User updates
   */
  updateUser(updates) {
    if (this._user) {
      this._user = { ...this._user, ...updates };
      this._notify();
    }
  }

  /**
   * Checks if user has permission.
   * @param {string} permission - Permission to check
   * @returns {boolean}
   */
  hasPermission(permission) {
    if (!this._user || !this._user.permissions) {
      return false;
    }
    return this._user.permissions.includes(permission);
  }

  /**
   * Notifies listeners.
   * @private
   */
  _notify() {
    this._listeners.forEach(listener => listener(this._user));
  }
}

// Singleton instance
const userContext = new UserContext();

module.exports = userContext;
