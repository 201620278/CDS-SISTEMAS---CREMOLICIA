/**
 * Contratos de repositories do Motor Comercial.
 *
 * @module motores/motor-comercial/domain/contracts/repositories
 */

const IPerfilComercialRepository = require('./IPerfilComercialRepository');
const IConsignacaoRepository = require('./IConsignacaoRepository');
const IConsignacaoItemRepository = require('./IConsignacaoItemRepository');
const IMovimentacaoComercialRepository = require('./IMovimentacaoComercialRepository');
const IMovimentacaoPerfilRepository = require('./IMovimentacaoPerfilRepository');

module.exports = {
  IPerfilComercialRepository,
  IConsignacaoRepository,
  IConsignacaoItemRepository,
  IMovimentacaoComercialRepository,
  IMovimentacaoPerfilRepository
};
