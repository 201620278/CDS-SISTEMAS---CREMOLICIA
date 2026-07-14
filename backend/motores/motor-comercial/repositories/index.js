/**
 * Repositories do Motor Comercial — Sprint 2.2
 *
 * @module motores/motor-comercial/repositories
 */

const PerfilComercialRepository = require('./PerfilComercialRepository');
const ConsignacaoRepository = require('./ConsignacaoRepository');
const ConsignacaoItemRepository = require('./ConsignacaoItemRepository');
const MovimentacaoComercialRepository = require('./MovimentacaoComercialRepository');
const MovimentacaoPerfilRepository = require('./MovimentacaoPerfilRepository');

module.exports = {
  PerfilComercialRepository,
  ConsignacaoRepository,
  ConsignacaoItemRepository,
  MovimentacaoComercialRepository,
  MovimentacaoPerfilRepository
};
