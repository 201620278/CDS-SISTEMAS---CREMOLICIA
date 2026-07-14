/**
 * usePagination — Pagination Hook
 *
 * Sprint 2.7: Arquitetura Frontend — hook de paginação.
 *
 * @module frontend/modules/motor-comercial/hooks/usePagination
 */

class usePagination {
  /**
   * Creates a pagination manager.
   * @param {Object} options
   * @param {number} [options.pageSize=10] - Page size
   * @param {number} [options.initialPage=1] - Initial page
   * @returns {Object}
   */
  static create(options = {}) {
    const {
      pageSize = 10,
      initialPage = 1
    } = options;

    let currentPage = initialPage;
    const listeners = new Set();

    const subscribe = (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    };

    const notify = () => {
      listeners.forEach(listener => listener({
        currentPage,
        pageSize,
        totalPages: Math.ceil(totalItems / pageSize),
        totalItems
      }));
    };

    let totalItems = 0;

    const setPage = (page) => {
      currentPage = Math.max(1, page);
      notify();
    };

    const nextPage = () => setPage(currentPage + 1);
    const prevPage = () => setPage(currentPage - 1);
    const firstPage = () => setPage(1);
    const lastPage = () => setPage(Math.ceil(totalItems / pageSize));

    const setPageSize = (size) => {
      pageSize = size;
      currentPage = 1;
      notify();
    };

    const setTotalItems = (total) => {
      totalItems = total;
      notify();
    };

    const getOffset = () => (currentPage - 1) * pageSize;
    const getLimit = () => pageSize;

    return {
      get currentPage() {
        return currentPage;
      },
      get pageSize() {
        return pageSize;
      },
      get totalPages() {
        return Math.ceil(totalItems / pageSize);
      },
      get totalItems() {
        return totalItems;
      },
      setPage,
      nextPage,
      prevPage,
      firstPage,
      lastPage,
      setPageSize,
      setTotalItems,
      getOffset,
      getLimit,
      subscribe
    };
  }
}

module.exports = usePagination;
