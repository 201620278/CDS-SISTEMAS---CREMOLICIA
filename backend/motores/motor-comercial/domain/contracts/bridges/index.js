/**
 * Contratos de bridges do Motor Comercial.
 *
 * @module motores/motor-comercial/domain/contracts/bridges
 */

const IEstoqueBridge = require('./IEstoqueBridge');
const IFinanceiroBridge = require('./IFinanceiroBridge');
const IClienteBridge = require('./IClienteBridge');
const IProdutoBridge = require('./IProdutoBridge');
const IUsuarioBridge = require('./IUsuarioBridge');

module.exports = {
  IEstoqueBridge,
  IFinanceiroBridge,
  IClienteBridge,
  IProdutoBridge,
  IUsuarioBridge
};
