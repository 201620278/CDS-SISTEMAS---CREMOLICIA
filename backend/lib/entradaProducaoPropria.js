/**
 * HOTFIX-IND-01 — Entrada de Produção Própria (transição Motor Indústria)
 *
 * Mesma rotina de abastecimento que o Motor Indústria reutilizará.
 * Não cria fornecedor fictício nem obrigação financeira.
 */

const TIPO_ENTRADA_COMPRA_FORNECEDOR = 'COMPRA_FORNECEDOR';
const TIPO_ENTRADA_PRODUCAO_PROPRIA = 'PRODUCAO_PROPRIA';
const ORIGEM_MOV_PRODUCAO_PROPRIA = 'PRODUCAO_PROPRIA';
const TIPO_MOV_ABASTECIMENTO_PRODUCAO = 'ABASTECIMENTO_PRODUCAO';
const FORNECEDOR_PRODUCAO_PROPRIA_LABEL = 'PRODUÇÃO PRÓPRIA';
const OBS_PRODUCAO_PROPRIA_PADRAO = 'Abastecimento proveniente da produção própria.';
const LOTE_ORIGEM_ABASTECIMENTO = 'ABASTECIMENTO_PRODUCAO';

function normalizarTipoEntrada(valor) {
  const raw = String(valor || '')
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

  if (
    raw === TIPO_ENTRADA_PRODUCAO_PROPRIA ||
    raw === 'PRODUCAO' ||
    raw === 'PRODUCAO_PROPRIA'
  ) {
    return TIPO_ENTRADA_PRODUCAO_PROPRIA;
  }

  return TIPO_ENTRADA_COMPRA_FORNECEDOR;
}

function isEntradaProducaoPropria(tipoEntrada) {
  return normalizarTipoEntrada(tipoEntrada) === TIPO_ENTRADA_PRODUCAO_PROPRIA;
}

/** Compra de fornecedor gera financeiro; produção própria não. */
function deveGerarFinanceiroEntrada(tipoEntrada) {
  return !isEntradaProducaoPropria(tipoEntrada);
}

/**
 * Normaliza campos de persistência para o INSERT em compras.
 * @returns {{
 *   tipo_entrada: string,
 *   fornecedor: string|null,
 *   observacao: string|null,
 *   origem_movimentacao: string|null,
 *   tipo_movimentacao: string|null,
 *   lote_origem: string,
 *   is_producao_propria: boolean
 * }}
 */
function resolverCamposEntrada(dados = {}) {
  const tipoEntrada = normalizarTipoEntrada(dados.tipo_entrada);
  const isProducao = isEntradaProducaoPropria(tipoEntrada);

  if (!isProducao) {
    return {
      tipo_entrada: TIPO_ENTRADA_COMPRA_FORNECEDOR,
      fornecedor: dados.fornecedor || null,
      observacao: dados.observacao || null,
      origem_movimentacao: null,
      tipo_movimentacao: null,
      lote_origem: 'COMPRA',
      is_producao_propria: false
    };
  }

  const observacaoInformada = String(dados.observacao || '').trim();

  return {
    tipo_entrada: TIPO_ENTRADA_PRODUCAO_PROPRIA,
    fornecedor: FORNECEDOR_PRODUCAO_PROPRIA_LABEL,
    observacao: observacaoInformada || OBS_PRODUCAO_PROPRIA_PADRAO,
    origem_movimentacao: ORIGEM_MOV_PRODUCAO_PROPRIA,
    tipo_movimentacao: TIPO_MOV_ABASTECIMENTO_PRODUCAO,
    lote_origem: LOTE_ORIGEM_ABASTECIMENTO,
    is_producao_propria: true
  };
}

module.exports = {
  TIPO_ENTRADA_COMPRA_FORNECEDOR,
  TIPO_ENTRADA_PRODUCAO_PROPRIA,
  ORIGEM_MOV_PRODUCAO_PROPRIA,
  TIPO_MOV_ABASTECIMENTO_PRODUCAO,
  FORNECEDOR_PRODUCAO_PROPRIA_LABEL,
  OBS_PRODUCAO_PROPRIA_PADRAO,
  LOTE_ORIGEM_ABASTECIMENTO,
  normalizarTipoEntrada,
  isEntradaProducaoPropria,
  deveGerarFinanceiroEntrada,
  resolverCamposEntrada
};
