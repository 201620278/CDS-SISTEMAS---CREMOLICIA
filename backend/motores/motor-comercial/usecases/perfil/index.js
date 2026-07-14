/**
 * Casos de Uso do Aggregate PerfilComercial — Sprint 2.3
 *
 * @module motores/motor-comercial/usecases/perfil
 */

const CriarPerfilComercialUseCase = require('./CriarPerfilComercialUseCase');
const AtivarPerfilComercialUseCase = require('./AtivarPerfilComercialUseCase');
const InativarPerfilComercialUseCase = require('./InativarPerfilComercialUseCase');
const AlterarLimiteComercialUseCase = require('./AlterarLimiteComercialUseCase');
const BloquearPerfilComercialUseCase = require('./BloquearPerfilComercialUseCase');
const DesbloquearPerfilComercialUseCase = require('./DesbloquearPerfilComercialUseCase');
const RegistrarLiberacaoGerencialUseCase = require('./RegistrarLiberacaoGerencialUseCase');
const ConsultarPerfilComercialUseCase = require('./ConsultarPerfilComercialUseCase');
const ConsultarHistoricoPerfilUseCase = require('./ConsultarHistoricoPerfilUseCase');
const ConsultarLimiteDisponivelUseCase = require('./ConsultarLimiteDisponivelUseCase');
const ConsultarScoreConfiabilidadeUseCase = require('./ConsultarScoreConfiabilidadeUseCase');
const AtualizarPerfilComercialUseCase = require('./AtualizarPerfilComercialUseCase');

module.exports = {
  CriarPerfilComercialUseCase,
  AtivarPerfilComercialUseCase,
  InativarPerfilComercialUseCase,
  AlterarLimiteComercialUseCase,
  BloquearPerfilComercialUseCase,
  DesbloquearPerfilComercialUseCase,
  RegistrarLiberacaoGerencialUseCase,
  ConsultarPerfilComercialUseCase,
  ConsultarHistoricoPerfilUseCase,
  ConsultarLimiteDisponivelUseCase,
  ConsultarScoreConfiabilidadeUseCase,
  AtualizarPerfilComercialUseCase
};
