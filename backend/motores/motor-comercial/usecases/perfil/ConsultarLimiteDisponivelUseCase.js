/**
 * UC-010 — ConsultarLimiteDisponivelUseCase
 *
 * Usa CreditoComercialService (regra oficial CDS).
 *
 * @class ConsultarLimiteDisponivelUseCase
 */

const PerfilReadUseCase = require('./PerfilReadUseCase');
const { PerfilInvalidoError } = require('../../domain/errors');
const { calcularLimiteDisponivel } = require('./perfilUseCaseHelpers');
const CreditoComercialService = require('../../services/CreditoComercialService');
const { carregarMovimentacoesComerciaisPerfil } = require('../../services/projections/ledgerCacheDerivation');

class ConsultarLimiteDisponivelUseCase extends PerfilReadUseCase {
  constructor(deps = {}) {
    super(deps);
    this._consignacaoRepository = deps.consignacaoRepository ?? null;
    this._movimentacaoComercialRepository = deps.movimentacaoComercialRepository ?? null;
    this._creditoComercialService = deps.creditoComercialService
      ?? new CreditoComercialService({
        perfilComercialRepository: deps.perfilComercialRepository,
        consignacaoRepository: deps.consignacaoRepository,
        movimentacaoComercialRepository: deps.movimentacaoComercialRepository
      });
  }

  async validar(entrada) {
    if (!entrada?.perfilComercialId) {
      throw new PerfilInvalidoError('perfilComercialId é obrigatório');
    }
  }

  async processar(entrada) {
    const perfil = await this._obterPerfilOuFalhar(entrada.perfilComercialId);
    const movimentacoesPerfil = await this._movimentacaoPerfilRepository.listar({
      perfilComercialId: entrada.perfilComercialId
    });

    let movimentacoesComerciais = [];
    if (this._movimentacaoComercialRepository && this._consignacaoRepository) {
      const uowLike = {
        consignacao: this._consignacaoRepository,
        movimentacaoComercial: this._movimentacaoComercialRepository
      };
      movimentacoesComerciais = await carregarMovimentacoesComerciaisPerfil(
        uowLike,
        entrada.perfilComercialId
      );
    }

    const credito = CreditoComercialService.calcular({
      limiteComercial: Number(perfil.limiteComercial ?? 0),
      movimentacoes: movimentacoesComerciais
    });

    // Ajustes de liberação gerencial / limite alterado via ledger de perfil
    const ajustado = calcularLimiteDisponivel(
      { ...perfil, limiteComercial: credito.limiteComercial },
      movimentacoesPerfil,
      credito.saldoDevedor
    );

    return {
      perfilComercialId: perfil.id,
      clienteId: perfil.clienteId,
      limiteComercial: ajustado.limiteComercial,
      saldoAberto: credito.saldoDevedor,
      saldoDevedor: credito.saldoDevedor,
      saldoCredor: credito.saldoCredor,
      limiteDisponivel: Math.max(0, ajustado.limiteComercial - credito.saldoDevedor),
      creditoDisponivel: Math.max(0, ajustado.limiteComercial - credito.saldoDevedor)
    };
  }
}

module.exports = ConsultarLimiteDisponivelUseCase;
