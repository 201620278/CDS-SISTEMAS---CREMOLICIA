/**
 * dfeXmlMetadados — Extração de metadados básicos de XML NF-e (sem parser oficial).
 *
 * Usado apenas para indexação na inbox. Parser oficial (NFeParserService) é sprint separada.
 *
 * @module services/fiscal/dfeXmlMetadados
 */

/**
 * @param {string} xml
 * @returns {string}
 */
function extrairTag(xml, tag) {
  return String(xml || '').match(new RegExp(`<${tag}>(.*?)</${tag}>`))?.[1] || '';
}

/**
 * @param {string} xml
 * @returns {string}
 */
function extrairChave(xml) {
  const chNFe = extrairTag(xml, 'chNFe');
  if (chNFe) return chNFe.replace(/\D/g, '');

  const idMatch = String(xml || '').match(/Id="NFe(\d{44})"/i);
  return idMatch?.[1] || '';
}

/**
 * @param {string} dh
 * @returns {string}
 */
function formatarDataIso(dh) {
  if (!dh) return '';
  const match = String(dh).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

/**
 * @param {string} xml
 * @returns {boolean}
 */
function detectarNfCancelada(xml) {
  const texto = String(xml || '');
  if (/<tpEvento>110111<\/tpEvento>/i.test(texto)) return true;
  if (/<tpEvento>110112<\/tpEvento>/i.test(texto)) return true;

  const cStat = extrairTag(texto, 'cStat');
  if (cStat === '101' || cStat === '135' || cStat === '136') return true;

  return false;
}

/**
 * @param {string} xml
 * @returns {Object}
 */
function extrairMetadadosNota(xml) {
  const chave = extrairChave(xml);
  const emitBlock = String(xml || '').match(/<emit>([\s\S]*?)<\/emit>/)?.[1] || '';

  return {
    chave,
    numero: extrairTag(xml, 'nNF'),
    serie: extrairTag(xml, 'serie'),
    modelo: extrairTag(xml, 'mod') || '55',
    fornecedor: extrairTag(emitBlock, 'xNome') || extrairTag(xml, 'xNome'),
    cnpjFornecedor: extrairTag(emitBlock, 'CNPJ') || extrairTag(xml, 'CNPJ'),
    dataEmissao: formatarDataIso(extrairTag(xml, 'dhEmi')),
    dataEntrada: formatarDataIso(extrairTag(xml, 'dhSaiEnt')),
    valorTotal: parseFloat(extrairTag(xml, 'vNF') || 0)
  };
}

module.exports = {
  extrairMetadadosNota,
  extrairChave,
  detectarNfCancelada
};
