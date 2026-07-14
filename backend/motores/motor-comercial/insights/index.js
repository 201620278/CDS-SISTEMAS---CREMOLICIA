/**
 * Insight Engine Comercial — bootstrap das regras.
 *
 * @module motores/motor-comercial/insights
 */

const InsightService = require('../../../shared/insights/services/InsightService');
const { criarRegrasComerciais } = require('./ComercialInsightRules');

/**
 * @returns {import('../../../shared/insights/services/InsightService')}
 */
function criarInsightServiceComercial() {
  const service = new InsightService();
  criarRegrasComerciais().forEach((regra) => service.registrarRegra(regra));
  return service;
}

module.exports = {
  criarInsightServiceComercial,
  criarRegrasComerciais
};
