/**
 * MiipImportacaoXmlService — Identificação MIIP em lote na importação XML.
 *
 * Sprint RC1: decisão exclusiva via Pipeline → DecisionEngine.
 *
 * @class MiipImportacaoXmlService
 */

const MiipImportacaoResultado = require('../core/MiipImportacaoResultado');
const { mapearDecisaoPipelineParaImportacao } = require('../utils/MiipResultadoImportacaoMapper');
const { mapearItemCompraParaIdentificavel } = require('../utils/mapearItemCompra');

const MOTOR_LABELS = Object.freeze({
  motor_gtin: 'GTIN / Código de Barras',
  motor_associacao_fornecedor: 'Associação Fornecedor'
});

class MiipImportacaoXmlService {
  /**
   * @param {Object} [deps]
   * @param {import('../MiipService')} [deps.miipService]
   * @param {import('../logs/MiipIntegracaoLogService')} [deps.integracaoLog]
   */
  constructor(deps = {}) {
    /** @private */
    this._miipService = deps.miipService ?? null;
    /** @private */
    this._integracaoLog = deps.integracaoLog ?? null;
    /** @private @type {Object|null} */
    this._sessaoAtual = null;
  }

  /**
   * @param {import('../MiipService')} service
   * @returns {void}
   */
  definirMiipService(service) {
    this._miipService = service;
  }

  /**
   * Última importação processada (memória).
   *
   * @returns {Object|null}
   */
  obterSessaoAtual() {
    return this._sessaoAtual;
  }

  /**
   * @private
   * @param {number} indice
   * @param {Object} itemXml
   * @param {Object} classificacao
   * @param {string} operacaoId
   * @returns {MiipImportacaoResultado}
   */
  _montarResultado(indice, itemXml, classificacao, operacaoId) {
    return MiipImportacaoResultado.create({
      indice,
      produtoXML: { ...itemXml },
      produtoEncontrado: classificacao.produtoEncontrado,
      nivelCerteza: classificacao.nivelCerteza,
      acao: classificacao.acao,
      motivos: classificacao.motivos,
      candidatoSelecionado: classificacao.candidatoSelecionado,
      precisaConfirmacao: classificacao.precisaConfirmacao,
      precisaCadastro: classificacao.precisaCadastro,
      associadoAutomaticamente: classificacao.associadoAutomaticamente,
      score: classificacao.score,
      motor: classificacao.motor,
      operacaoId
    });
  }

  /**
   * Processa todos os itens de uma NF-e importada.
   *
   * @param {Object} dadosXml - Saída do parse-xml
   * @returns {Promise<Object>}
   */
  async processar(dadosXml = {}) {
    if (!this._miipService) {
      throw new Error('MiipImportacaoXmlService: MiipService não configurado.');
    }

    const inicio = Date.now();
    const itens = Array.isArray(dadosXml.itens) ? dadosXml.itens : [];
    const fornecedorCnpj = dadosXml.fornecedor_cnpj || dadosXml.fornecedorCnpj || null;
    const fornecedorNome = dadosXml.fornecedor || dadosXml.fornecedor_nome || null;
    const operacaoBase = dadosXml.chave_acesso || `xml-${Date.now()}`;

    const contexto = {
      origem: 'compra',
      ponto: 'importacao_xml'
    };

    const resultados = [];

    for (let indice = 0; indice < itens.length; indice += 1) {
      const itemXml = itens[indice] || {};
      const itemIdentificavel = mapearItemCompraParaIdentificavel({
        ...itemXml,
        fornecedor_cnpj: fornecedorCnpj,
        fornecedor_nome: fornecedorNome
      });

      const miipResp = await this._miipService.identificar(itemIdentificavel, contexto);
      const resultado = miipResp?.resultado;
      const operacaoId = resultado?.requestId || `${operacaoBase}-${indice}`;

      const classificacao = mapearDecisaoPipelineParaImportacao(miipResp, resultado);
      resultados.push(this._montarResultado(indice, itemXml, classificacao, operacaoId));
    }

    const tempoProcessamento = Date.now() - inicio;
    const resumo = {
      totalItens: resultados.length,
      identificadosAutomaticamente: resultados.filter((r) => r.associadoAutomaticamente).length,
      precisamConfirmacao: resultados.filter((r) => r.precisaConfirmacao).length,
      precisamCadastro: resultados.filter((r) => r.precisaCadastro).length,
      tempoProcessamento
    };

    const payload = {
      usarMiipImportacaoXML: true,
      operacaoId: operacaoBase,
      resultados: resultados.map((r) => r.toJSON()),
      resumo
    };

    this._sessaoAtual = {
      ...payload,
      processadoEm: new Date().toISOString(),
      fornecedorCnpj,
      fornecedorNome
    };

    if (this._integracaoLog) {
      this._integracaoLog.registrar({
        evento: 'importacao_xml_concluida',
        origem: 'compra',
        ponto: 'importacao_xml',
        usarMiip: true,
        motivo: 'processamento_lote',
        duracaoMs: tempoProcessamento,
        item: {
          totalItens: resumo.totalItens,
          identificadosAutomaticamente: resumo.identificadosAutomaticamente,
          precisamConfirmacao: resumo.precisamConfirmacao,
          precisamCadastro: resumo.precisamCadastro
        }
      });
    }

    return payload;
  }

  /**
   * Converte resultado MIIP em sugestão compatível com a UI existente.
   *
   * @param {MiipImportacaoResultado|Object} resultado
   * @returns {Object|null}
   */
  static paraSugestaoUi(resultado) {
    if (!resultado?.precisaConfirmacao || !resultado.produtoEncontrado) {
      return null;
    }

    const motor = resultado.motor;
    return {
      indice: resultado.indice,
      encontrado: true,
      produtoId: resultado.produtoEncontrado.id,
      produtoNome: resultado.produtoEncontrado.nome,
      produtoCodigo: resultado.produtoEncontrado.codigo,
      codigoBarras: resultado.produtoEncontrado.codigoBarras,
      confianca: resultado.nivelCerteza,
      motor,
      motorLabel: MOTOR_LABELS[motor] || motor || 'MIIP',
      score: resultado.score,
      acao: resultado.acao,
      operacaoId: resultado.operacaoId,
      status: 'pendente'
    };
  }
}

module.exports = MiipImportacaoXmlService;
