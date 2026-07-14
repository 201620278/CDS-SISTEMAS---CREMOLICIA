/**
 * DocumentoConsignacaoSequenciador — Geração oficial CONS-AAAA-000001
 *
 * Sprint S-6: identificador sequencial único por ano.
 *
 * @module motores/motor-comercial/services/DocumentoConsignacaoSequenciador
 */

const SERIE_PREFIXO = 'CONS';

/**
 * @param {number} [ano]
 * @returns {string}
 */
function obterSerieAnual(ano = new Date().getFullYear()) {
  return `${SERIE_PREFIXO}-${ano}`;
}

/**
 * @param {string} serie
 * @param {number} sequencial
 * @returns {string}
 */
function formatarNumeroOficial(serie, sequencial) {
  return `${serie}-${String(sequencial).padStart(6, '0')}`;
}

/**
 * Aloca próximo documento dentro da transação do repositório.
 * @param {import('../repositories/ConsignacaoRepository')} consignacaoRepository
 * @param {number} [ano]
 * @returns {Promise<{ numero: string, serie: string, sequencial: number, dataEmissao: string, situacao: string }>}
 */
async function gerarDocumentoConsignacaoOficial(consignacaoRepository, ano = new Date().getFullYear()) {
  const serie = obterSerieAnual(ano);
  const sequencial = await consignacaoRepository.obterProximoSequencialDocumento(serie);
  const numero = formatarNumeroOficial(serie, sequencial);

  return {
    numero,
    serie,
    sequencial,
    dataEmissao: new Date().toISOString(),
    situacao: 'RASCUNHO'
  };
}

/**
 * Pré-visualização sem reservar sequencial (baseado no MAX atual).
 * @param {import('../repositories/ConsignacaoRepository')} consignacaoRepository
 * @param {number} [ano]
 */
async function preverProximoDocumentoConsignacao(consignacaoRepository, ano = new Date().getFullYear()) {
  const serie = obterSerieAnual(ano);
  const atual = await consignacaoRepository.obterMaxSequencialDocumento(serie);
  const sequencial = atual + 1;
  return {
    numero: formatarNumeroOficial(serie, sequencial),
    serie,
    sequencial,
    situacao: 'RASCUNHO'
  };
}

module.exports = {
  SERIE_PREFIXO,
  obterSerieAnual,
  formatarNumeroOficial,
  gerarDocumentoConsignacaoOficial,
  preverProximoDocumentoConsignacao
};
