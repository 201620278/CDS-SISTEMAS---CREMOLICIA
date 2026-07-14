/**
 * Motor de Recomendações Comerciais — Sprint O-9.
 *
 * @module motores/motor-comercial/recommendations
 */

const RecommendationService = require('./RecommendationService');
const RecommendationMapper = require('./RecommendationMapper');

function criarRecommendationService() {
  return new RecommendationService();
}

module.exports = {
  RecommendationService,
  RecommendationMapper,
  criarRecommendationService
};
