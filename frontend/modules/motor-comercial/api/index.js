/**
 * API — Index (versão oficial)
 *
 * Sprint 2.7: Arquitetura Frontend — índice da API.
 *
 * @module frontend/modules/motor-comercial/api
 */

const ApiClient = require('./client');
const MotorComercialApi = require('./MotorComercialApi');
const ProjectionApi = require('./ProjectionApi');
const HealthApi = require('./HealthApi');

module.exports = {
  ApiClient,
  MotorComercialApi,
  ProjectionApi,
  HealthApi
};
