/**
 * STAB-06 — FinalizarPrestacaoComVendaOficialUseCase
 *
 * Orquestra: leitura da prestação → PrestacaoVendaAdapter → criarVenda() → Fechar.
 * NFC-e apenas via fluxo oficial do PDV (criarVenda / VendaFiscalService).
 *
 * @module motores/motor-comercial/usecases/consignacao/FinalizarPrestacaoComVendaOficialUseCase
 */

const BaseUseCase = require('../base/BaseUseCase');
const {
  montarPayloadCriarVenda,
  buildResumoFinalPrestacao,
  calcularIntegridadeComercial
} = require('../../../../services/vendas/adapters/PrestacaoVendaAdapter');
const { criarVendaInterna } = require('../../../../services/vendas/criarVendaInterna');
const { DocumentoInvalidoError } = require('../../domain/errors');
const {
  garantirPrestacaoAberta,
  calcularTotaisPrestacao,
  listarMovimentacoesPrestacao
} = require('./prestacaoOperacaoHelpers');
const { gerarCorrelationId } = require('./consignacaoUseCaseHelpers');
const db = require('../../../../database');
const faturamentoStore = require('../../services/prestacaoFaturamentoStore');

class FinalizarPrestacaoComVendaOficialUseCase extends BaseUseCase {
  constructor(deps = {}) {
    super(deps);
    this._fechar = deps.fecharPrestacaoUseCase || null;
    this._criarVendaFn = deps.criarVendaFn || criarVendaInterna;
  }

  async validar(entrada) {
    if (!entrada?.consignacaoId) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
  }

  async processar(entrada) {
    const t0 = Date.now();
    const mark = (label) => {
      console.log(`[STAB06-AUDIT] [${Date.now() - t0}ms] ${label}`);
    };
    mark('iniciou UseCase');

    const correlationId = entrada.correlationId || gerarCorrelationId();
    // STAB-06.3: emissão é exclusivo de EmitirNfcePrestacaoUseCase.
    // Legacy: só cria venda embutida se emitirFiscal === true explicitamente.
    const emitirFiscal = entrada.emitirFiscal === true;
    const fechar = entrada.fechar !== false;
    mark(`flags emitirFiscal=${emitirFiscal} fechar=${fechar}`);

    const uow = this.obterUnitOfWork();
    if (!uow) {
      throw new Error('UnitOfWork não configurado');
    }

    mark('carregando prestação (UoW)');
    const ctx = await uow.executar(async (tx) => {
      const consignacao = await tx.consignacao.buscarPorId(entrada.consignacaoId);
      const grupo = garantirPrestacaoAberta(consignacao);
      const itens = await tx.consignacaoItem.listarPorConsignacao(consignacao.id);
      const movs = await listarMovimentacoesPrestacao(tx, grupo.id, consignacao.id);
      const totais = calcularTotaisPrestacao(movs, grupo.id);
      return { consignacao, grupo, itens, totais };
    });
    mark('prestação carregada');

    const { consignacao, grupo, itens, totais } = ctx;

    const itensVendidos = (itens || [])
      .filter((i) => Number(i.quantidadeVendida || 0) > 0)
      .map((i) => ({
        produtoId: i.produtoId,
        quantidade: Number(i.quantidadeVendida),
        precoUnitario: Number(i.precoUnitario || 0),
        itemId: i.id
      }));

    const totalVendido = Number(totais.totalVendido || 0);
    const totalRecebido = Number(totais.totalRecebido || 0);
    const integridade = calcularIntegridadeComercial(totalVendido, totalRecebido);
    mark(`totais venda=${totalVendido} recebido=${totalRecebido} itens=${itensVendidos.length}`);
    const resumo = buildResumoFinalPrestacao({
      totalVendido,
      totalRecebido,
      emitirFiscal,
      temItensFiscais: itensVendidos.length > 0
    });
    mark('adapter/resumo montados');

    if (entrada.apenasResumo) {
      mark('apenasResumo — retorno precoce');
      const fatRow = await faturamentoStore.obterPorConsignacao(consignacao.id);
      return {
        resumo,
        integridade,
        consignacaoId: consignacao.id,
        grupoPrestacaoId: grupo.id,
        correlationId,
        faturamento: faturamentoStore.toDto(fatRow)
      };
    }

    // STAB-06.3: encerrar sem emitir de novo — exige faturamento quando há venda
    if (fechar && !entrada.emitirFiscalForcado) {
      const fatRow = await faturamentoStore.obterPorConsignacao(consignacao.id);
      const fat = faturamentoStore.toDto(fatRow);
      if (totalVendido > 0.01 && !fat.podeEncerrarFiscal) {
        throw new DocumentoInvalidoError(
          fat.situacaoFiscal === faturamentoStore.SITUACAO.REJEITADA
            ? `NFC-e rejeitada: ${fat.nfce?.motivo || 'corrija e emita novamente antes de encerrar.'}`
            : 'Emita a NFC-e (ou aguarde autorização) antes de encerrar a prestação.'
        );
      }
    }

    let venda = null;
    if (totalVendido > 0.01 && itensVendidos.length > 0 && emitirFiscal) {
      // Legacy path STAB-06 — preferir EmitirNfcePrestacaoUseCase
      const payload = montarPayloadCriarVenda({
        consignacaoId: consignacao.id,
        prestacaoId: grupo.id,
        grupoPrestacaoId: grupo.id,
        clienteId: consignacao.clienteId,
        itensVendidos,
        totalVendido,
        totalRecebido,
        emitirFiscal
      });
      payload.metadata.correlationId = correlationId;
      mark('payload criarVenda pronto — entrou criarVendaInterna (bloqueia até res.json)');

      venda = await this._criarVendaFn(payload);
      mark(`criarVendaInterna retornou vendaId=${venda?.id || venda?.venda_id}`);
      await vincularOrigemConsignacao({
        vendaId: venda.id || venda.venda_id,
        consignacaoId: consignacao.id,
        grupoPrestacaoId: grupo.id,
        metadata: payload.metadata
      });
      mark('vínculo origem consignacao gravado');
    } else {
      mark('sem create embutido (STAB-06.3: emitir via emitir-nfce)');
    }

    let fechamento = null;
    if (fechar) {
      const fecharUc = this._fechar;
      if (!fecharUc) {
        throw new Error('fecharPrestacaoUseCase não configurado');
      }
      mark('entrou fecharPrestacao');
      fechamento = await fecharUc.executar({
        consignacaoId: consignacao.id,
        usuarioId: entrada.usuarioId,
        correlationId,
        motivo: entrada.motivo || 'Encerramento com venda oficial STAB-06'
      });
      mark('fecharPrestacao concluído');
    }

    const fatRow = await faturamentoStore.obterPorConsignacao(consignacao.id);
    mark('UseCase finalizado — resposta HTTP a caminho');
    return {
      resumo,
      integridade,
      venda,
      fechamento,
      consignacaoId: consignacao.id,
      grupoPrestacaoId: grupo.id,
      correlationId,
      faturamento: faturamentoStore.toDto(fatRow),
      stab: 'STAB-06.3'
    };
  }
}

function vincularOrigemConsignacao({ vendaId, consignacaoId, grupoPrestacaoId, metadata }) {
  if (!vendaId) return Promise.resolve();
  return new Promise((resolve) => {
    db.run(
      `
      CREATE TABLE IF NOT EXISTS venda_origem_consignacao (
        venda_id INTEGER PRIMARY KEY,
        consignacao_id INTEGER NOT NULL,
        grupo_prestacao_id INTEGER,
        metadata_json TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
      `,
      () => {
        db.run(
          `
          INSERT OR REPLACE INTO venda_origem_consignacao
            (venda_id, consignacao_id, grupo_prestacao_id, metadata_json)
          VALUES (?, ?, ?, ?)
          `,
          [
            Number(vendaId),
            Number(consignacaoId),
            grupoPrestacaoId != null ? Number(grupoPrestacaoId) : null,
            JSON.stringify(metadata || {})
          ],
          () => resolve()
        );
      }
    );
  });
}

module.exports = FinalizarPrestacaoComVendaOficialUseCase;
