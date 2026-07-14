/**
 * SituacaoClienteProjectionService — Situação comercial consolidada do cliente.
 *
 * @class SituacaoClienteProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const SituacaoClienteDTO = require('../../dto/SituacaoClienteDTO');
const ProjectionContext = require('./ProjectionContext');
const { DocumentoInvalidoError } = require('../../domain/errors');
const CreditoComercialService = require('../CreditoComercialService');
const {
  calcularSaldosComerciais,
  listarMovimentacoesComerciais,
  filtrarConsignacoesAbertas,
  obterUltimaMovimentacaoPorTipo,
  prestacaoEstaAberta,
  ordenarCronologicamente
} = require('./projectionHelpers');

class SituacaoClienteProjectionService extends BaseProjectionService {
  async validar(contexto) {
    if (contexto.clienteId == null) {
      throw new DocumentoInvalidoError('clienteId é obrigatório para Situação do Cliente');
    }
    if (!this._consignacaoRepository) {
      throw new DocumentoInvalidoError('IConsignacaoRepository não configurado');
    }
  }

  async consultar(contexto) {
    const [consignacoes, perfis] = await Promise.all([
      this._consignacaoRepository.listar({ clienteId: contexto.clienteId }),
      this._perfilComercialRepository?.listar({ clienteId: contexto.clienteId }) ?? []
    ]);

    const movimentacoesPorConsignacao = await Promise.all(
      consignacoes.map((c) => listarMovimentacoesComerciais(
        this._movimentacaoComercialRepository,
        ProjectionContext.create({ ...contexto.toJSON(), consignacaoId: c.id })
      ))
    );

    return {
      consignacoes,
      perfis,
      movimentacoes: movimentacoesPorConsignacao.flat()
    };
  }

  async projetar({ consignacoes, perfis, movimentacoes }, contexto) {
    const perfil = perfis.find((p) => p.perfilTipo === 'CONSIGNADO') ?? perfis[0] ?? null;
    const abertas = filtrarConsignacoesAbertas(consignacoes);
    const prestacaoAtiva = consignacoes.find((c) => prestacaoEstaAberta(c))?.prestacaoContasAtiva ?? null;
    const saldos = calcularSaldosComerciais(movimentacoes);
    const ultimaMovimentacao = ordenarCronologicamente(movimentacoes, 'DESC')[0] ?? null;
    const ultimoPagamento = obterUltimaMovimentacaoPorTipo(movimentacoes, 'PAGAMENTO');

    const limiteComercial = Number(perfil?.limiteComercial ?? 0);
    const credito = CreditoComercialService.calcular({
      limiteComercial,
      movimentacoes
    });

    let statusGeral = 'REGULAR';
    if (perfil?.bloqueado) statusGeral = 'BLOQUEADO';
    else if (credito.saldoDevedor > 0 || saldos.saldoEmAberto > 0) statusGeral = 'EM_ABERTO';
    else if (prestacaoAtiva) statusGeral = 'EM_PRESTACAO';

    const dto = SituacaoClienteDTO.create({
      clienteId: contexto.clienteId,
      perfil,
      limite: limiteComercial,
      limiteComercial,
      saldo: credito.saldoDevedor,
      saldoDevedor: credito.saldoDevedor,
      saldoCredor: credito.saldoCredor,
      creditoDisponivel: credito.creditoDisponivel,
      limiteDisponivel: credito.creditoDisponivel,
      saldoEmAberto: saldos.saldoEmAberto,
      consignacoesAbertas: abertas.map((c) => ({
        id: c.id,
        status: c.status,
        documento: c.documento
      })),
      prestacaoAtiva,
      ultimaMovimentacao,
      ultimoPagamento,
      statusGeral
    });

    return {
      dados: dto.toJSON(),
      totais: { ...saldos, ...credito },
      metadata: {
        quantidadeConsignacoes: consignacoes.length,
        quantidadeAbertas: abertas.length
      }
    };
  }
}

module.exports = SituacaoClienteProjectionService;
