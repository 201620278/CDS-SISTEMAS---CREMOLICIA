/**
 * MIIP — Motor Inteligente de Identificação de Produtos
 *
 * Fachada pública do módulo. Ponto de entrada único para rotas, serviços
 * e outros módulos do CDS Sistemas.
 *
 * Responsabilidade:
 * - Expor API estável do domínio de identificação de produtos
 * - Ocultar detalhes internos de engines, repositórios e persistência
 *
 * Sprint 1: apenas estrutura — sem bootstrap em server.js.
 *
 * @module motores/miip
 */

const MiipService = require('./MiipService');
const MiipOrchestrator = require('./MiipOrchestrator');

const contracts = {
  ItemIdentificavelDTO: require('./contracts/ItemIdentificavelDTO'),
  ProdutoCandidatoDTO: require('./contracts/ProdutoCandidatoDTO'),
  DecisaoIdentificacaoDTO: require('./contracts/DecisaoIdentificacaoDTO'),
  RelatorioDecisaoDTO: require('./contracts/RelatorioDecisaoDTO')
};

const core = {
  IMotorIdentificacao: require('./core/IMotorIdentificacao'),
  MotorRegistry: require('./core/MotorRegistry'),
  MiipAction: require('./core/MiipAction'),
  MiipConfidence: require('./core/MiipConfidence'),
  MiipContext: require('./core/MiipContext'),
  MiipResult: require('./core/MiipResult'),
  MiipScore: require('./core/MiipScore'),
  MiipEvidence: require('./core/MiipEvidence'),
  MiipCandidate: require('./core/MiipCandidate')
};

const repositories = require('./repositories');
const engines = require('./engines');

// TODO (Sprint 2+): inicializar() — bootstrap do motor no server.js
// TODO (Sprint 2+): encerrar() — liberação de recursos

module.exports = {
  MiipService,
  MiipOrchestrator,
  contracts,
  core,
  repositories,
  engines
};
