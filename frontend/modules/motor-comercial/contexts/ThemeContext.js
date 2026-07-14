/**
 * ThemeContext — Theme Context Provider
 *
 * Sprint 2.7: Arquitetura Frontend — contexto de tema.
 *
 * @module frontend/modules/motor-comercial/contexts/ThemeContext
 */

const theme = require('../theme');

class ThemeContext {
  constructor() {
    this._theme = theme;
    this._listeners = new Set();
  }

  /**
   * Gets current theme.
   * @returns {Object}
   */
  getTheme() {
    return this._theme;
  }

  /**
   * Subscribes to theme changes.
   * @param {Function} listener - Listener function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Updates theme.
   * @param {Object} newTheme - New theme values
   */
  updateTheme(newTheme) {
    this._theme = { ...this._theme, ...newTheme };
    this._listeners.forEach(listener => listener(this._theme));
  }
}

// Singleton instance
const themeContext = new ThemeContext();

module.exports = themeContext;
