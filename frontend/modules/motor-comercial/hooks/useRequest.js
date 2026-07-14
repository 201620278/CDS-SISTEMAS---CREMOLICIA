/**
 * useRequest — API Request Hook
 *
 * Sprint 2.7: Arquitetura Frontend — hook de requisições.
 *
 * @module frontend/modules/motor-comercial/hooks/useRequest
 */

const useLoading = require('./useLoading');

class useRequest {
  /**
   * Creates a request manager.
   * @param {Object} apiClient - API client instance
   * @returns {Object}
   */
  static create(apiClient) {
    const loading = useLoading.create(false);
    let data = null;
    let error = null;

    const execute = async (requestFn) => {
      loading.startLoading();
      error = null;

      try {
        const result = await requestFn(apiClient);
        data = result;
        return result;
      } catch (err) {
        error = err;
        throw err;
      } finally {
        loading.stopLoading();
      }
    };

    const reset = () => {
      data = null;
      error = null;
      loading.stopLoading();
    };

    return {
      get isLoading() {
        return loading.isLoading;
      },
      get data() {
        return data;
      },
      get error() {
        return error;
      },
      execute,
      reset,
      subscribe: loading.subscribe
    };
  }
}

module.exports = useRequest;
