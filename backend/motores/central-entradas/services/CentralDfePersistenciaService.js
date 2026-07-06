/**
 * CentralDfePersistenciaService — Persistência de documentos DF-e na Central de Entradas.
 *
 * Sprint 4: inbox only — sem compras, estoque, financeiro ou MIIP.
 *
 * @class CentralDfePersistenciaService
 */

const { DocumentoFiscalStatus } = require('../core/DocumentoFiscalStatus');
const CentralDocumentosRepository = require('../repositories/CentralDocumentosRepository');
const CentralHistoricoRepository = require('../repositories/CentralHistoricoRepository');
const { resolverDb, criarDbHelpers } = require('../repositories/dbHelpers');
const { extrairMetadadosNota } = require('../../../services/fiscal/dfeXmlMetadados');

class CentralDfePersistenciaService {
  /**
   * @param {Object} [deps]
   * @param {Object|null} [deps.db]
   * @param {import('../repositories/CentralDocumentosRepository')} [deps.documentosRepository]
   * @param {import('../repositories/CentralHistoricoRepository')} [deps.historicoRepository]
   */
  constructor(deps = {}) {
    /** @private */
    this._db = deps.db ?? null;
    /** @private */
    this._documentosRepository = deps.documentosRepository
      ?? new CentralDocumentosRepository({ db: this._db });
    /** @private */
    this._historicoRepository = deps.historicoRepository
      ?? new CentralHistoricoRepository({ db: this._db });
  }

  /** @private */
  _obterSql() {
    return criarDbHelpers(resolverDb(this._db));
  }

  /**
   * @param {string} chave
   * @returns {Promise<boolean>}
   */
  async existeCompraComChave(chave) {
    if (!chave) return false;

    const sql = this._obterSql();
    await sql.whenReady();

    const row = await sql.get(
      'SELECT id FROM compras WHERE chave_acesso = ? LIMIT 1',
      [chave]
    );

    return Boolean(row);
  }

  /**
   * @param {Object} dados
   * @param {string} dados.xml
   * @param {string} [dados.nsu]
   * @param {string} dados.origem
   * @returns {Promise<{ novo: boolean, duplicado: boolean, ignorado: boolean, documento: Object|null, motivo?: string }>}
   */
  async persistirDocumentoDfe(dados) {
    const metadados = extrairMetadadosNota(dados.xml);
    const chave = metadados.chave;

    if (!chave) {
      return {
        novo: false,
        duplicado: false,
        ignorado: true,
        documento: null,
        motivo: 'XML sem chave de acesso identificável'
      };
    }

    const existente = await this._documentosRepository.buscarPorChave(chave);
    if (existente) {
      return {
        novo: false,
        duplicado: true,
        ignorado: false,
        documento: existente,
        motivo: 'Documento já existente na Central'
      };
    }

    const jaComprada = await this.existeCompraComChave(chave);
    const status = jaComprada
      ? DocumentoFiscalStatus.DUPLICADA
      : DocumentoFiscalStatus.SINCRONIZADA;

    const documento = await this._documentosRepository.inserir({
      chave,
      numero: metadados.numero,
      serie: metadados.serie,
      modelo: metadados.modelo,
      fornecedor: metadados.fornecedor,
      cnpjFornecedor: metadados.cnpjFornecedor,
      dataEmissao: metadados.dataEmissao,
      dataEntrada: metadados.dataEntrada,
      valorTotal: metadados.valorTotal,
      xml: dados.xml,
      nsu: dados.nsu ?? null,
      origem: dados.origem,
      status,
      statusDetalhe: jaComprada
        ? 'NF-e já registrada em compras'
        : null
    });

    const detalheHistorico = dados.origem === 'consulta_chave'
      ? 'Documento recebido via consulta por chave DF-e'
      : dados.origem === 'upload_manual'
        ? 'Documento recebido via upload manual de XML'
        : 'Documento recebido via Distribuição DF-e';

    await this._historicoRepository.inserir({
      documentoId: documento.id,
      statusAnterior: null,
      statusNovo: status,
      detalhe: detalheHistorico
    });

    if (status === DocumentoFiscalStatus.SINCRONIZADA) {
      const { emitirDocumentoRecebido } = require('../utils/centralEventosEmitter');
      emitirDocumentoRecebido(documento, dados.origem || 'dfe').catch(() => {});
    }

    return {
      novo: status === DocumentoFiscalStatus.SINCRONIZADA,
      duplicado: status === DocumentoFiscalStatus.DUPLICADA,
      ignorado: false,
      documento
    };
  }
}

module.exports = CentralDfePersistenciaService;
