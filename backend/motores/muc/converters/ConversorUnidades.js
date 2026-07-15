/**
 * Conversões oficiais do Motor de Unidades Comerciais (MUC).
 * Estoque e custo sempre em unidade base; vendas/compras usam fator_conversao.
 */

function arredondar(valor, casas = 6) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  const f = 10 ** casas;
  return Math.round(n * f) / f;
}

/**
 * Converte quantidade comercial → quantidade na unidade base.
 * Ex.: 500 mL com fator 0.001 → 0.5 L
 */
function paraBase(quantidadeComercial, fatorConversao) {
  return arredondar(Number(quantidadeComercial || 0) * Number(fatorConversao || 0), 6);
}

/**
 * Converte quantidade na unidade base → quantidade comercial.
 * Ex.: 0.5 L com fator 0.001 → 500 mL
 */
function deBase(quantidadeBase, fatorConversao) {
  const fator = Number(fatorConversao || 0);
  if (fator <= 0) return 0;
  return arredondar(Number(quantidadeBase || 0) / fator, 6);
}

/**
 * Resolve baixa de estoque a partir de uma unidade comercial escolhida.
 */
function resolverBaixaEstoque({ quantidadeComercial, fatorConversao }) {
  const quantidadeBase = paraBase(quantidadeComercial, fatorConversao);
  return {
    quantidade_comercial: arredondar(quantidadeComercial, 6),
    quantidade_base: quantidadeBase,
    fator_conversao: Number(fatorConversao || 0)
  };
}

/**
 * Resolve entrada de estoque (compras/inventário) em qualquer UOM comercial.
 */
function resolverEntradaEstoque({ quantidadeComercial, fatorConversao }) {
  return resolverBaixaEstoque({ quantidadeComercial, fatorConversao });
}

module.exports = {
  arredondar,
  paraBase,
  deBase,
  resolverBaixaEstoque,
  resolverEntradaEstoque
};
