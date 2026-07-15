/**
 * Motor de Unidades Comerciais (MUC) V1.0
 *
 * Um produto → várias unidades comerciais → estoque único na unidade base.
 * Não altera Motor Fiscal / Comercial / Financeiro / MIIP — integra via bridges locais.
 */

const conversor = require('./converters/ConversorUnidades');
const validator = require('./validators/UnidadeComercialValidator');
const repository = require('./repositories/ProdutoUnidadeRepository');
const service = require('./services/ProdutoUnidadeService');
const { bootstrapMucSchema } = require('./migrations/001_produto_unidades');

const MotorUnidadesComerciais = {
  versao: '1.0.0',
  conversor,
  validator,
  repository,
  service,
  bootstrapMucSchema,

  paraBase: conversor.paraBase,
  deBase: conversor.deBase,
  resolverBaixaEstoque: conversor.resolverBaixaEstoque,
  resolverEntradaEstoque: conversor.resolverEntradaEstoque,

  listar: service.listar,
  criar: service.criar,
  atualizar: service.atualizar,
  excluir: service.excluir,
  marcarPrincipal: service.marcarPrincipal,
  garantirUnidadeBase: service.garantirUnidadeBase,
  resolverPorBarras: service.resolverPorBarras,
  obterUnidadeVenda: service.obterUnidadeVenda,
  montarPayloadVenda: service.montarPayloadVenda
};

module.exports = MotorUnidadesComerciais;
