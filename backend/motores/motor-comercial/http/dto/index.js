/**
 * DTOs HTTP — Index.
 *
 * Sprint 2.5: API REST — DTOs.
 *
 * @module motores/motor-comercial/http/dto
 */

const { CriarPerfilRequest, AtualizarPerfilRequest, AlterarLimiteRequest, PerfilResponse, LimiteResponse, ScoreResponse } = require('./PerfilDTO');
const {
  CriarConsignacaoRequest,
  EditarConsignacaoRequest,
  AdicionarItemRequest,
  AlterarQuantidadeItemRequest,
  RegistrarEntregaRequest,
  RegistrarEmissaoTermoEntregaRequest,
  AbrirPrestacaoRequest,
  RegistrarDevolucaoRequest,
  TransferenciaRequest,
  RegistrarVendaRequest,
  RegistrarPerdaRequest,
  RegistrarCortesiaRequest,
  RegistrarPagamentoRequest,
  ConsignacaoResponse,
  ItemConsignacaoResponse
} = require('./ConsignacaoDTO');
const {
  DashboardResponse,
  ContaCorrenteResponse,
  TimelineResponse,
  ResumoPrestacaoResponse,
  SaldoResponse,
  HistoricoResponse,
  IndicadoresResponse,
  SituacaoClienteResponse
} = require('./ProjectionDTO');

module.exports = {
  // Perfil DTOs
  CriarPerfilRequest,
  AtualizarPerfilRequest,
  AlterarLimiteRequest,
  PerfilResponse,
  LimiteResponse,
  ScoreResponse,

  // Consignação DTOs
  CriarConsignacaoRequest,
  EditarConsignacaoRequest,
  AdicionarItemRequest,
  AlterarQuantidadeItemRequest,
  RegistrarEntregaRequest,
  RegistrarEmissaoTermoEntregaRequest,
  AbrirPrestacaoRequest,
  RegistrarDevolucaoRequest,
  TransferenciaRequest,
  RegistrarVendaRequest,
  RegistrarPerdaRequest,
  RegistrarCortesiaRequest,
  RegistrarPagamentoRequest,
  ConsignacaoResponse,
  ItemConsignacaoResponse,

  // Projection DTOs
  DashboardResponse,
  ContaCorrenteResponse,
  TimelineResponse,
  ResumoPrestacaoResponse,
  SaldoResponse,
  HistoricoResponse,
  IndicadoresResponse,
  SituacaoClienteResponse
};
