/**
 * Central de Prestação — mapeadores e fases do fluxo guiado (Sprint S-6)
 *
 * @module frontend/modules/motor-comercial/pages/PrestacaoContas/prestacaoCentralMappers
 */

const FASES_PRESTACAO = Object.freeze([
  { id: 'conferir', label: 'Conferir Produtos' },
  { id: 'devolucoes', label: 'Devoluções' },
  { id: 'perdas', label: 'Perdas' },
  { id: 'cortesias', label: 'Cortesias' },
  { id: 'resultado', label: 'Resultado' },
  { id: 'conta', label: 'Conta Corrente' },
  { id: 'ledger', label: 'Movimentações' },
  { id: 'finalizar', label: 'Finalizar' }
]);

/**
 * @param {Object} resumo
 * @param {Object} [contaCorrente]
 * @returns {Object}
 */
function buildResumoFinanceiroCentral(resumo = {}, contaCorrente = null) {
  const resumoSafe = resumo || {};
  const contaSafe = contaCorrente || {};
  const saldoAtual = Number(resumoSafe.saldoAtual ?? 0);
  const saldoCliente = Number(contaSafe.saldoAtual ?? contaSafe.saldo ?? 0);
  return {
    valorEntregue: Number(resumo.valorConsignado ?? 0),
    valorVendido: Number(resumo.valorVendido ?? 0),
    valorDevolvido: Number(resumo.valorDevolvido ?? 0),
    perdas: Number(resumo.valorPerdido ?? 0),
    cortesias: Number(resumo.valorCortesia ?? 0),
    totalRecebido: Number(resumo.valorRecebido ?? 0),
    saldoCliente,
    saldoAposPrestacao: saldoAtual
  };
}

/**
 * @param {Array} historico
 * @returns {Array}
 */
function buildAuditoriaPrestacao(historico = []) {
  return historico.slice(0, 50).map((mov) => ({
    data: mov.dataMovimentacao || mov.data || mov.createdAt,
    usuario: mov.usuarioNome || mov.usuarioId || mov.operador || '-',
    tipo: mov.tipoMovimentacao || mov.tipo || '-',
    valor: mov.valor,
    observacao: mov.observacao || mov.motivo || ''
  }));
}

/**
 * @param {Array} historico
 * @returns {Array}
 */
function buildLedgerRows(historico = []) {
  return historico.map((mov) => ({
    id: mov.id,
    data: mov.dataMovimentacao || mov.data,
    tipo: mov.tipoMovimentacao || mov.tipo,
    produto: mov.produto || mov.produtoNome || '-',
    quantidade: mov.quantidade,
    valor: mov.valor,
    origem: mov.origem || 'LEDGER',
    usuario: mov.usuarioNome || mov.usuarioId || '-'
  }));
}

module.exports = {
  FASES_PRESTACAO,
  buildResumoFinanceiroCentral,
  buildAuditoriaPrestacao,
  buildLedgerRows
};
