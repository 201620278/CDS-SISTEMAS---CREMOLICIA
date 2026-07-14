/**
 * Projection Services — Camada oficial de leitura/projeção.
 *
 * @module motores/motor-comercial/services/projections
 */

const BaseProjectionService = require('./BaseProjectionService');
const ProjectionContext = require('./ProjectionContext');
const ProjectionResult = require('./ProjectionResult');
const ContaCorrenteProjectionService = require('./ContaCorrenteProjectionService');
const TimelineProjectionService = require('./TimelineProjectionService');
const ResumoPrestacaoProjectionService = require('./ResumoPrestacaoProjectionService');
const SaldoProjectionService = require('./SaldoProjectionService');
const IndicadoresProjectionService = require('./IndicadoresProjectionService');
const DashboardProjectionService = require('./DashboardProjectionService');
const HistoricoProjectionService = require('./HistoricoProjectionService');
const SituacaoClienteProjectionService = require('./SituacaoClienteProjectionService');
const InsightsProjectionService = require('./InsightsProjectionService');
const PendenciasProjectionService = require('./PendenciasProjectionService');
const RecomendacoesProjectionService = require('./RecomendacoesProjectionService');
const PlaybooksProjectionService = require('./PlaybooksProjectionService');
const WorkflowProjectionService = require('./WorkflowProjectionService');
const ledgerCacheDerivation = require('./ledgerCacheDerivation');
const ledgerCacheSync = require('./ledgerCacheSync');

module.exports = {
  BaseProjectionService,
  ProjectionContext,
  ProjectionResult,
  ContaCorrenteProjectionService,
  TimelineProjectionService,
  ResumoPrestacaoProjectionService,
  SaldoProjectionService,
  IndicadoresProjectionService,
  DashboardProjectionService,
  HistoricoProjectionService,
  SituacaoClienteProjectionService,
  InsightsProjectionService,
  PendenciasProjectionService,
  RecomendacoesProjectionService,
  PlaybooksProjectionService,
  WorkflowProjectionService,
  ledgerCacheDerivation,
  ledgerCacheSync
};
