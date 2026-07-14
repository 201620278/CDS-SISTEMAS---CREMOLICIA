/**
 * useLoading — Loading State Hook
 *
 * Sprint 2.7: Arquitetura Frontend — hook de loading.
 *
 * @module frontend/modules/motor-comercial/hooks/useLoading
 */

class useLoading {
  /**
   * Creates a loading state manager.
   * @param {boolean} [initialState=false] - Initial loading state
   * @returns {Object}
   */
  static create(initialState = false) {
    let loading = initialState;
    const listeners = new Set();

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    const setLoading = (value) => {
      loading = value;
      listeners.forEach(listener => listener(loading));
    };

    const startLoading = () => setLoading(true);
    const stopLoading = () => setLoading(false);

    return {
      get isLoading() {
        return loading;
      },
      setLoading,
      startLoading,
      stopLoading,
      subscribe
    };
  }
}

module.exports = useLoading;
