/**
 * UC-019 — AbrirPrestacaoUseCase
 *
 * @class AbrirPrestacaoUseCase
 */

const ConsignacaoWriteUseCase = require('./ConsignacaoWriteUseCase');
const { EVENTOS_DOMINIO } = require('../../events/comercialEventosTipos');
const { DocumentoInvalidoError, ConsignacaoNaoEntregueError } = require('../../domain/errors');
const { gerarCorrelationId, enfileirarEvento, STATUS_ENTREGUE } = require('./consignacaoUseCaseHelpers');
const { registrarMovimentacaoComercial, prestacaoEstaAberta } = require('./consignacaoOperacaoHelpers');
const {
  criarGrupoPrestacaoContas,
  criarSnapshotPrestacao,
  validarDocumentoPrestacao
} = require('./prestacaoOperacaoHelpers');

class AbrirPrestacaoUseCase extends ConsignacaoWriteUseCase {
  async validar(entrada) {
    const id = Number(entrada?.consignacaoId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new DocumentoInvalidoError('consignacaoId é obrigatório');
    }
    entrada.consignacaoId = id;
  }

  async processar(entrada) {
    const correlationId = entrada.correlationId ?? gerarCorrelationId();
    const origem = entrada.origem ?? 'USUARIO';

    return this.executarEscrita(async (uow, eventos) => {
      const consignacao = await uow.consignacao.buscarPorId(entrada.consignacaoId);
      if (!consignacao) {
        throw new DocumentoInvalidoError('Consignação não encontrada');
      }

      // INVARIANT: prestação aberta no ponteiro ⇒ reutilizar (nunca criar novo grupo)
      if (prestacaoEstaAberta(consignacao)) {
        console.log('[INVARIANT PRESTACAO] reutilizando ponteiro aberto', {
          consignacaoId: consignacao.id,
          prestacaoId: consignacao.prestacaoContasAtiva?.id
        });
        return {
          consignacao,
          grupoPrestacaoContas: consignacao.prestacaoContasAtiva,
          movimentacao: null,
          correlationId,
          idempotente: true
        };
      }

      // INVARIANT: ciclo aberto no ledger (sem FECHAMENTO) ⇒ reancorar ponteiro, nunca criar
      const movsExistentes = await uow.movimentacaoComercial.listar({ consignacaoId: consignacao.id });
      const {
        encontrarGrupoPrestacaoRecuperavel
      } = require('./prestacaoOperacaoHelpers');
      const grupoRecuperavelId = encontrarGrupoPrestacaoRecuperavel(movsExistentes);
      if (grupoRecuperavelId) {
        console.log('[INVARIANT PRESTACAO] reutilizando grupo recuperável do ledger', {
          consignacaoId: consignacao.id,
          prestacaoId: grupoRecuperavelId
        });
        const movAbertura = movsExistentes.find(
          (m) => m.tipoMovimentacao === 'ABERTURA_PRESTACAO'
            && String(m.grupoPrestacaoContasId) === String(grupoRecuperavelId)
        );
        const grupoRecuperado = {
          id: grupoRecuperavelId,
          status: 'ABERTA',
          documento: movAbertura?.snapshot?.grupoPrestacaoContas?.documento
            || movAbertura?.snapshot?.documento
            || consignacao.documento
            || null,
          dataAbertura: movAbertura?.dataMovimentacao || new Date().toISOString()
        };
        const consignacaoRecuperada = await uow.consignacao.atualizar(consignacao.id, {
          prestacaoContasAtiva: grupoRecuperado
        });
        return {
          consignacao: consignacaoRecuperada,
          grupoPrestacaoContas: grupoRecuperado,
          movimentacao: null,
          correlationId,
          recuperadoDoLedger: true
        };
      }

      if (consignacao.status !== STATUS_ENTREGUE) {
        throw new ConsignacaoNaoEntregueError(consignacao.id, consignacao.status);
      }

      const documento = entrada.documento ?? null;
      if (documento) {
        await validarDocumentoPrestacao(uow.consignacao, documento, consignacao.id);
      }

      // Defesa: revalidar ledger imediatamente antes de criar (cache inconsistente)
      const movsAntesDeCriar = await uow.movimentacaoComercial.listar({ consignacaoId: consignacao.id });
      const aindaRecuperavel = encontrarGrupoPrestacaoRecuperavel(movsAntesDeCriar);
      if (aindaRecuperavel) {
        console.log('[INVARIANT PRESTACAO] bloqueou criação — grupo aberto ainda existe', {
          consignacaoId: consignacao.id,
          prestacaoId: aindaRecuperavel
        });
        const movAbertura = movsAntesDeCriar.find(
          (m) => m.tipoMovimentacao === 'ABERTURA_PRESTACAO'
            && String(m.grupoPrestacaoContasId) === String(aindaRecuperavel)
        );
        const grupoRecuperado = {
          id: aindaRecuperavel,
          status: 'ABERTA',
          documento: movAbertura?.snapshot?.grupoPrestacaoContas?.documento
            || movAbertura?.snapshot?.documento
            || consignacao.documento
            || null,
          dataAbertura: movAbertura?.dataMovimentacao || new Date().toISOString()
        };
        const consignacaoRecuperada = await uow.consignacao.atualizar(consignacao.id, {
          prestacaoContasAtiva: grupoRecuperado
        });
        return {
          consignacao: consignacaoRecuperada,
          grupoPrestacaoContas: grupoRecuperado,
          movimentacao: null,
          correlationId,
          recuperadoDoLedger: true
        };
      }

      console.log('[INVARIANT PRESTACAO] criando novo grupo (nenhum aberto no ledger)', {
        consignacaoId: consignacao.id
      });

      const itens = await uow.consignacaoItem.listarPorConsignacao(consignacao.id);
      const grupo = criarGrupoPrestacaoContas(consignacao, documento);
      const totais = {
        totalVendido: 0,
        totalDevolvido: 0,
        totalPerdido: 0,
        totalCortesia: 0,
        totalRecebido: 0,
        saldo: 0
      };

      const snapshot = criarSnapshotPrestacao(
        consignacao,
        grupo,
        itens,
        totais,
        { operacao: 'ABERTURA_PRESTACAO' }
      );

      const movimentacao = await registrarMovimentacaoComercial(uow, {
        consignacaoId: consignacao.id,
        tipoMovimentacao: 'ABERTURA_PRESTACAO',
        origem,
        correlationId,
        grupoPrestacaoContasId: grupo.id,
        snapshot,
        usuarioId: entrada.usuarioId ?? null,
        motivo: entrada.motivo ?? 'Abertura da prestação de contas'
      });

      const consignacaoAtualizada = await uow.consignacao.atualizar(consignacao.id, {
        prestacaoContasAtiva: grupo
      });

      enfileirarEvento(eventos, EVENTOS_DOMINIO.PRESTACAO_ABERTA, consignacao.id, {
        consignacao: consignacaoAtualizada,
        grupoPrestacaoContas: grupo,
        movimentacao,
        documento: grupo.documento,
        correlationId
      }, correlationId);

      return {
        consignacao: consignacaoAtualizada,
        grupoPrestacaoContas: grupo,
        movimentacao,
        correlationId
      };
    });
  }
}

module.exports = AbrirPrestacaoUseCase;
