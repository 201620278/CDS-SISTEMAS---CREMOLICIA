/**
 * ContaCorrenteProjectionService — Reconstrói Conta Corrente Comercial.
 *
 * Sprint 2.4.4: leitura exclusiva do Ledger.
 *
 * @class ContaCorrenteProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const ProjectionContext = require('./ProjectionContext');
const ContaCorrenteDTO = require('../../dto/ContaCorrenteDTO');
const { DocumentoInvalidoError } = require('../../domain/errors');
const {
  filtrarPorFlag,
  ordenarCronologicamente,
  somarPorTipo,
  calcularSaldoContaCorrente,
  listarMovimentacoesComerciais,
  TIPOS_FINANCEIROS
} = require('./projectionHelpers');

class ContaCorrenteProjectionService extends BaseProjectionService {
  async validar(contexto) {
    if (contexto.consignacaoId == null && contexto.clienteId == null) {
      throw new DocumentoInvalidoError('consignacaoId ou clienteId é obrigatório para Conta Corrente');
    }
    if (!this._movimentacaoComercialRepository) {
      throw new DocumentoInvalidoError('IMovimentacaoComercialRepository não configurado');
    }
  }

  async consultar(contexto) {
    if (contexto.consignacaoId != null) {
      const movimentacoes = await listarMovimentacoesComerciais(
        this._movimentacaoComercialRepository,
        contexto
      );
      return filtrarPorFlag(movimentacoes, 'geraContaCorrente');
    }

    const consignacoes = await this._consignacaoRepository?.listar({
      clienteId: contexto.clienteId
    }) ?? [];

    const movimentacoesPorConsignacao = await Promise.all(
      consignacoes.map((c) => listarMovimentacoesComerciais(
        this._movimentacaoComercialRepository,
        ProjectionContext.create({ ...contexto.toJSON(), consignacaoId: c.id })
      ))
    );

    return filtrarPorFlag(movimentacoesPorConsignacao.flat(), 'geraContaCorrente');
  }

  async projetar(movimentacoes, contexto) {
    const ordenadas = ordenarCronologicamente(movimentacoes, contexto.ordenacao);
    const saldoInicial = contexto.dataInicio
      ? calcularSaldoContaCorrente(ordenadas, contexto.dataInicio)
      : 0;

    const noPeriodo = contexto.dataInicio && contexto.dataFim
      ? ordenadas.filter((m) => {
        const data = new Date(m.dataMovimentacao);
        return data >= new Date(contexto.dataInicio) && data <= new Date(contexto.dataFim);
      })
      : ordenadas;

    const vendas = somarPorTipo(noPeriodo, TIPOS_FINANCEIROS.VENDA);
    const perdas = somarPorTipo(noPeriodo, TIPOS_FINANCEIROS.PERDA);
    const cortesias = somarPorTipo(noPeriodo, TIPOS_FINANCEIROS.CORTESIA);
    const pagamentos = somarPorTipo(noPeriodo, TIPOS_FINANCEIROS.PAGAMENTO);
    const saldoAtual = saldoInicial + vendas - pagamentos;

    const dto = ContaCorrenteDTO.create({
      escopo: contexto.consignacaoId != null ? 'CONSIGNACAO' : 'CLIENTE',
      consignacaoId: contexto.consignacaoId ?? null,
      clienteId: contexto.clienteId ?? null,
      saldoInicial,
      vendas,
      perdas,
      cortesias,
      pagamentos,
      saldoAtual,
      lancamentos: noPeriodo.map((m) => ({
        id: m.id,
        tipo: m.tipoMovimentacao,
        valor: m.valor,
        data: m.dataMovimentacao,
        correlationId: m.correlationId
      }))
    });

    return {
      dados: dto.toJSON(),
      totais: { saldoInicial, vendas, perdas, cortesias, pagamentos, saldoAtual }
    };
  }
}

module.exports = ContaCorrenteProjectionService;
