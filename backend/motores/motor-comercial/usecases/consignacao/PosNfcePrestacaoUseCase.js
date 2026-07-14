/**
 * STAB-06.3+ — Após NFC-e autorizada no Módulo Fiscal:
 * sincroniza prestacao_faturamento e encerra a Prestação vinculada.
 *
 * @module motores/motor-comercial/usecases/consignacao/PosNfcePrestacaoUseCase
 */

const BaseUseCase = require('../base/BaseUseCase');
const { DocumentoInvalidoError } = require('../../domain/errors');
const faturamentoStore = require('../../services/prestacaoFaturamentoStore');
const db = require('../../../../database');

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

class PosNfcePrestacaoUseCase extends BaseUseCase {
  constructor(deps = {}) {
    super(deps);
    this._finalizar = deps.finalizarPrestacaoComVendaOficialUseCase || null;
  }

  async validar(entrada) {
    if (!entrada?.vendaId) {
      throw new DocumentoInvalidoError('vendaId é obrigatório');
    }
  }

  async processar(entrada) {
    const vendaId = Number(entrada.vendaId);
    const fechar = entrada.fechar !== false;

    const origem = await getAsync(
      `
      SELECT venda_id, consignacao_id, grupo_prestacao_id
      FROM venda_origem_consignacao
      WHERE venda_id = ?
      `,
      [vendaId]
    );

    if (!origem?.consignacao_id) {
      return {
        stab: 'STAB-06.3',
        vendaId,
        vinculadaPrestacao: false,
        mensagem: 'Venda sem vínculo com Prestação — nada a encerrar.'
      };
    }

    const nota = await getAsync(
      `
      SELECT id, status, numero, chave_acesso, protocolo, xml_retorno
      FROM nfce_notas
      WHERE venda_id = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [vendaId]
    );

    const status = String(nota?.status || '').toLowerCase();
    const autorizada = status === 'autorizada';
    const rejeitada = status.includes('rejeit');

    let situacaoFiscal = faturamentoStore.SITUACAO.PENDENTE;
    let faturada = false;
    if (autorizada) {
      situacaoFiscal = faturamentoStore.SITUACAO.AUTORIZADA;
      faturada = true;
    } else if (rejeitada) {
      situacaoFiscal = faturamentoStore.SITUACAO.REJEITADA;
    } else if (status === 'sem_itens_fiscais') {
      situacaoFiscal = faturamentoStore.SITUACAO.NAO_APLICAVEL;
      faturada = true;
    }

    const motivo = rejeitada
      ? extrairMotivo(nota?.xml_retorno)
      : null;

    const faturamento = await faturamentoStore.salvar({
      consignacaoId: origem.consignacao_id,
      grupoPrestacaoId: origem.grupo_prestacao_id,
      vendaId,
      situacaoFiscal,
      faturada,
      nfceChave: nota?.chave_acesso || null,
      nfceNumero: nota?.numero != null ? String(nota.numero) : null,
      nfceProtocolo: nota?.protocolo || null,
      nfceStatus: nota?.status || null,
      nfceMotivo: motivo
    });

    let fechamento = null;
    if (fechar && faturada) {
      const uc = this._finalizar;
      if (!uc) throw new Error('finalizarPrestacaoComVendaOficialUseCase não configurado');
      fechamento = await uc.executar({
        consignacaoId: origem.consignacao_id,
        usuarioId: entrada.usuarioId,
        emitirFiscal: false,
        fechar: true,
        correlationId: entrada.correlationId,
        motivo: entrada.motivo || 'Encerramento automático após NFC-e autorizada'
      });
    }

    return {
      stab: 'STAB-06.3',
      vendaId,
      vinculadaPrestacao: true,
      consignacaoId: origem.consignacao_id,
      nfceNotaId: nota?.id || null,
      faturamento: faturamentoStore.toDto(faturamento),
      fechamento,
      mensagem: autorizada
        ? 'NFC-e sincronizada e prestação encerrada.'
        : 'Faturamento sincronizado; prestação não encerrada (NFC-e não autorizada).'
    };
  }
}

function extrairMotivo(raw) {
  const m = String(raw || '').match(/<xMotivo>([^<]+)<\/xMotivo>/i);
  return m ? m[1].trim() : null;
}

module.exports = PosNfcePrestacaoUseCase;
