/**
 * Sincronização de cache persistido a partir do Ledger.
 *
 * Sprint P-1: colunas como saldo_aberto são cache — nunca fonte oficial.
 *
 * @module motores/motor-comercial/services/projections/ledgerCacheSync
 */

const {
  derivarSaldoAbertoPerfil,
  derivarCamposCacheConsignacao,
  carregarMovimentacoesComerciaisPerfil,
  carregarMovimentacoesConsignacao
} = require('./ledgerCacheDerivation');

/**
 * @param {import('../../infrastructure/transactions/UnitOfWork')} uow
 * @param {number|string} perfilComercialId
 * @returns {Promise<Object|null>}
 */
async function sincronizarCachePerfil(uow, perfilComercialId) {
  const movimentacoes = await carregarMovimentacoesComerciaisPerfil(uow, perfilComercialId);
  const saldoAberto = derivarSaldoAbertoPerfil(movimentacoes);
  return uow.perfilComercial.atualizar(perfilComercialId, { saldoAberto });
}

/**
 * @param {import('../../infrastructure/transactions/UnitOfWork')} uow
 * @param {number|string} consignacaoId
 * @returns {Promise<Object|null>}
 */
async function sincronizarCacheConsignacao(uow, consignacaoId) {
  const movimentacoes = await carregarMovimentacoesConsignacao(uow, consignacaoId);
  const cache = derivarCamposCacheConsignacao(movimentacoes);
  return uow.consignacao.atualizar(consignacaoId, cache);
}

/**
 * Deriva saldo aberto do perfil sem persistir (validações pré-escrita).
 *
 * @param {import('../../infrastructure/transactions/UnitOfWork')} uow
 * @param {number|string} perfilComercialId
 * @returns {Promise<number>}
 */
async function obterSaldoAbertoPerfilDerivado(uow, perfilComercialId) {
  const movimentacoes = await carregarMovimentacoesComerciaisPerfil(uow, perfilComercialId);
  return derivarSaldoAbertoPerfil(movimentacoes);
}

/**
 * Deriva campos cache da consignação sem persistir.
 *
 * @param {import('../../infrastructure/transactions/UnitOfWork')} uow
 * @param {number|string} consignacaoId
 * @returns {Promise<{ valorTotalEntregue: number, valorTotalAcertado: number, valorTotalPago: number, saldoAberto: number }>}
 */
async function obterCamposCacheConsignacaoDerivados(uow, consignacaoId) {
  const movimentacoes = await carregarMovimentacoesConsignacao(uow, consignacaoId);
  return derivarCamposCacheConsignacao(movimentacoes);
}

module.exports = {
  sincronizarCachePerfil,
  sincronizarCacheConsignacao,
  obterSaldoAbertoPerfilDerivado,
  obterCamposCacheConsignacaoDerivados
};
