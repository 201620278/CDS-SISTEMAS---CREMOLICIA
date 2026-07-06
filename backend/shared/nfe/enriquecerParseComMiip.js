/**
 * enriquecerParseComMiip — Enriquecimento MIIP do parse NF-e (pipeline único).
 *
 * Usado por Compras (parse-xml) e Central de Entradas (processar).
 * Não altera regras do MIIP — apenas delega e aplica resultados nos itens.
 *
 * @module shared/nfe/enriquecerParseComMiip
 */

const MiipService = require('../../motores/miip/MiipService');
const MiipImportacaoXmlService = require('../../motores/miip/services/MiipImportacaoXmlService');
const { extrairPendencias } = require('../../motores/miip/utils/miipCentralRevisaoUtils');

/**
 * @param {Object} parsed — saída de NFeParserService.parse()
 * @returns {Promise<{ parsed: Object, miipImportacao: Object|null, possuiPendencias: boolean, erroMiip?: string }>}
 */
async function enriquecerParseComMiip(parsed) {
  const resultado = {
    parsed,
    miipImportacao: null,
    possuiPendencias: false
  };

  try {
    const miipImportacao = await MiipService.processarImportacaoXml(parsed);
    if (!miipImportacao) {
      return resultado;
    }

    parsed.miip_importacao = miipImportacao;
    resultado.miipImportacao = miipImportacao;

    (miipImportacao.resultados || []).forEach((itemResultado, indice) => {
      const item = parsed.itens[indice];
      if (!item) return;

      item.miip_resultado = itemResultado;

      if (itemResultado.associadoAutomaticamente && itemResultado.produtoEncontrado?.id) {
        item.produto_id = itemResultado.produtoEncontrado.id;
      }

      const sugestao = MiipImportacaoXmlService.paraSugestaoUi(itemResultado);
      if (sugestao) {
        item.miip_sugestao = sugestao;
      }
    });

    resultado.possuiPendencias = extrairPendencias(miipImportacao.resultados || []).length > 0;
    return resultado;
  } catch (error) {
    console.error('[enriquecerParseComMiip] Falha MIIP — parse segue sem bloqueio:', error?.message);
    resultado.erroMiip = error.message;
    return resultado;
  }
}

module.exports = {
  enriquecerParseComMiip
};
