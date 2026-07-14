/**
 * HealthApi — API Client for Health Check
 *
 * Sprint 2.7: Arquitetura Frontend — API de Health Check.
 *
 * @module frontend/modules/motor-comercial/api/HealthApi
 */

const ApiClient = require('./client');

class HealthApi {
  constructor(options = {}) {
    this.client = new ApiClient(options);
  }

  /**
   * Verifica saúde da API.
   * @returns {Promise}
   */
  async health() {
    return this.client.get('/health');
  }

  /**
   * Obtém versão da API.
   * @returns {Promise}
   */
  async version() {
    return this.client.get('/version');
  }

  /**
   * Obtém status da API.
   * @returns {Promise}
   */
  async status() {
    return this.client.get('/status');
  }
}

module.exports = HealthApi;
