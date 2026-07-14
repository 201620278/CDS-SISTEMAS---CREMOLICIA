/**
 * useFilters — Filter State Hook
 *
 * Sprint 2.7: Arquitetura Frontend — hook de filtros.
 *
 * @module frontend/modules/motor-comercial/hooks/useFilters
 */

class useFilters {
  /**
   * Creates a filter manager.
   * @param {Object} [initialFilters={}] - Initial filters
   * @returns {Object}
   */
  static create(initialFilters = {}) {
    let filters = { ...initialFilters };
    const listeners = new Set();

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    const setFilter = (key, value) => {
      filters[key] = value;
      listeners.forEach(listener => listener({ ...filters }));
    };

    const setFilters = (newFilters) => {
      filters = { ...filters, ...newFilters };
      listeners.forEach(listener => listener({ ...filters }));
    };

    const removeFilter = (key) => {
      delete filters[key];
      listeners.forEach(listener => listener({ ...filters }));
    };

    const clearFilters = () => {
      filters = {};
      listeners.forEach(listener => listener({ ...filters }));
    };

    const resetFilters = () => {
      filters = { ...initialFilters };
      listeners.forEach(listener => listener({ ...filters }));
    };

    const hasFilter = (key) => filters[key] !== undefined && filters[key] !== null && filters[key] !== '';

    const getActiveCount = () => {
      return Object.keys(filters).filter(key => hasFilter(key)).length;
    };

    return {
      get filters() {
        return { ...filters };
      },
      setFilter,
      setFilters,
      removeFilter,
      clearFilters,
      resetFilters,
      hasFilter,
      getActiveCount,
      subscribe
    };
  }
}

module.exports = useFilters;
