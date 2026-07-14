/**
 * Indicadores — redireciona para Central de Inteligência Analítica (grupo Executivos).
 *
 * Sprint O-7.
 *
 * @module frontend/modules/motor-comercial/pages/Indicadores
 */

const RelatoriosPage = require('../Relatorios');

module.exports = {
  create(params = {}, query = {}) {
    return RelatoriosPage.create(params, { ...query, grupo: 'executivos', relatorio: query.relatorio || 'indicadores' });
  }
};
