/**
 * DashboardProjectionService — Consolida indicadores para dashboard.
 *
 * @class DashboardProjectionService
 */

const BaseProjectionService = require('./BaseProjectionService');
const DashboardDTO = require('../../dto/DashboardDTO');
const IndicadoresProjectionService = require('./IndicadoresProjectionService');
const SaldoProjectionService = require('./SaldoProjectionService');
const { DocumentoInvalidoError } = require('../../domain/errors');

class DashboardProjectionService extends BaseProjectionService {
  constructor(deps = {}) {
    super(deps);
    this._indicadoresService = deps.indicadoresService
      ?? new IndicadoresProjectionService(deps);
    this._saldoService = deps.saldoService
      ?? new SaldoProjectionService(deps);
  }

  async validar(contexto) {
    if (!this._movimentacaoComercialRepository) {
      throw new DocumentoInvalidoError('IMovimentacaoComercialRepository não configurado');
    }
  }

  async consultar(contexto) {
    const [indicadoresResult, saldoResult] = await Promise.all([
      this._indicadoresService.executar(contexto),
      contexto.clienteId != null || contexto.consignacaoId != null
        ? this._saldoService.executar(contexto)
        : Promise.resolve(null)
    ]);

    return { indicadoresResult, saldoResult };
  }

  async projetar({ indicadoresResult, saldoResult }, contexto) {
    const indicadores = indicadoresResult.indicadores;
    const saldos = saldoResult?.totais ?? {};

    const alertas = [];
    if (saldos.saldoEmAberto > 0) {
      alertas.push({
        tipo: 'SALDO_EM_ABERTO',
        severidade: 'INFO',
        mensagem: `Saldo em aberto: ${saldos.saldoEmAberto}`
      });
    }
    if (indicadores.percentualPerda > 10) {
      alertas.push({
        tipo: 'PERDA_ELEVADA',
        severidade: 'WARN',
        mensagem: `Percentual de perda: ${indicadores.percentualPerda.toFixed(2)}%`
      });
    }

    const cards = [
      { titulo: 'Valor Consignado', valor: indicadores.valorConsignado },
      { titulo: 'Valor Vendido', valor: indicadores.valorVendido },
      { titulo: 'Valor Perdido', valor: indicadores.valorPerdido },
      { titulo: 'Saldo em Aberto', valor: saldos.saldoEmAberto ?? 0 }
    ];

    const dto = DashboardDTO.create({
      cards,
      kpis: indicadores,
      totais: saldos,
      alertas
    });

    return {
      dados: dto.toJSON(),
      indicadores,
      totais: saldos,
      metadata: { escopo: contexto.clienteId ? 'CLIENTE' : 'GLOBAL' }
    };
  }
}

module.exports = DashboardProjectionService;
