/**
 * Prestação Locator — mappers UX-12 (somente apresentação).
 * Sem regra de negócio / sem cálculo financeiro.
 *
 * @module frontend/modules/motor-comercial/pages/PrestacaoLocator/locatorMappers
 */

const { consignacaoElegivelParaPrestacao } = require('../PrestacaoContas/fecharConsignacaoMappers');

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value) || 0);
}

function formatDateTime(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR');
}

function pickTelefone(cliente = {}) {
  return cliente.telefone
    || cliente.celular
    || cliente.fone
    || cliente.telefonePrincipal
    || '—';
}

function pickCidade(cliente = {}) {
  const end = cliente.endereco || {};
  const cidade = cliente.cidade || end.cidade || end.municipio || '';
  const uf = cliente.uf || end.uf || '';
  if (!cidade) return '—';
  return uf ? `${cidade}/${uf}` : String(cidade);
}

function pickDocumento(cliente = {}, consignacao = {}) {
  const docCliente = cliente.cpf_cnpj || cliente.cpfCnpj || cliente.documento || cliente.cnpj || cliente.cpf;
  if (docCliente) return String(docCliente);
  const doc = consignacao.documento;
  if (doc && typeof doc === 'object') return String(doc.numero || doc.codigo || '—');
  if (doc) return String(doc);
  return consignacao.id != null ? `C-${consignacao.id}` : '—';
}

function pickSaldo(consignacao = {}, situacao = {}) {
  const candidates = [
    consignacao.saldoAberto,
    consignacao.saldo,
    consignacao.saldoAtual,
    situacao.saldoEmAberto,
    situacao.saldoAtual,
    situacao.saldo
  ];
  for (const v of candidates) {
    if (v != null && v !== '') return Number(v) || 0;
  }
  return 0;
}

function pickUltimaMov(consignacao = {}) {
  return consignacao.updatedAt
    || consignacao.atualizadoEm
    || consignacao.dataUltimaMovimentacao
    || consignacao.ultimaMovimentacao
    || consignacao.entregueEm
    || null;
}

function pickStatus(consignacao = {}) {
  const prest = consignacao.prestacaoContasAtiva;
  if (prest && String(prest.status || '').toUpperCase() === 'ABERTA') return 'Em atendimento';
  const status = String(consignacao.status || '').toUpperCase();
  if (status === 'EM_PRESTACAO') return 'Em atendimento';
  if (status === 'ENTREGUE') return 'Entregue';
  if (status === 'ACERTADA' || status === 'ENCERRADA') return 'Encerrada';
  return status || '—';
}

/**
 * Escolhe a consignação elegível mais relevante do cliente.
 * @param {Array} consignacoes
 * @returns {object|null}
 */
function escolherConsignacaoElegivel(consignacoes = []) {
  const list = Array.isArray(consignacoes) ? consignacoes : [];
  const elegiveis = list.filter((c) => consignacaoElegivelParaPrestacao(c));
  if (!elegiveis.length) return null;

  const score = (c) => {
    const s = String(c.status || '').toUpperCase();
    if (s === 'EM_PRESTACAO') return 3;
    if (c.prestacaoContasAtiva && String(c.prestacaoContasAtiva.status || '').toUpperCase() === 'ABERTA') return 3;
    if (s === 'ENTREGUE') return 2;
    if (s === 'ACERTADA') return 1;
    return 0;
  };

  return elegiveis.slice().sort((a, b) => {
    const ds = score(b) - score(a);
    if (ds !== 0) return ds;
    const ta = new Date(pickUltimaMov(a) || 0).getTime();
    const tb = new Date(pickUltimaMov(b) || 0).getTime();
    return tb - ta;
  })[0];
}

/**
 * Monta item de resultado do SmartSearch / EntityCard.
 */
function buildLocatorResult({ cliente, consignacao, situacao = {} } = {}) {
  if (!cliente || !consignacao) return null;
  const saldo = pickSaldo(consignacao, situacao);
  const nome = cliente.nome || cliente.razaoSocial || cliente.nomeFantasia || `Cliente #${cliente.id}`;
  const documento = pickDocumento(cliente, consignacao);
  const telefone = pickTelefone(cliente);
  const cidade = pickCidade(cliente);
  const ultima = formatDateTime(pickUltimaMov(consignacao));
  const status = pickStatus(consignacao);

  return {
    id: consignacao.id,
    title: nome,
    subtitle: documento,
    description: `${telefone} · ${cidade}`,
    status,
    badges: saldo > 0 ? [{ text: 'Saldo em aberto', variant: 'warning' }] : [{ text: 'Sem saldo', variant: 'info' }],
    metadata: [
      { label: 'Telefone', value: telefone },
      { label: 'Cidade', value: cidade },
      { label: 'Saldo em aberto', value: formatCurrency(saldo) },
      { label: 'Última movimentação', value: ultima }
    ],
    data: {
      clienteId: cliente.id,
      clienteNome: nome,
      consignacaoId: consignacao.id,
      documento,
      telefone,
      cidade,
      saldo,
      status
    }
  };
}

function matchesQuery(cliente = {}, consignacao = {}, query = '') {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const digits = q.replace(/\D/g, '');
  const hay = [
    cliente.nome,
    cliente.razaoSocial,
    cliente.nomeFantasia,
    cliente.cpf_cnpj,
    cliente.cpfCnpj,
    cliente.documento,
    cliente.telefone,
    cliente.celular,
    cliente.id,
    consignacao.id,
    consignacao.documento?.numero,
    consignacao.documento,
    consignacao.codigo
  ].map((v) => String(v ?? '').toLowerCase()).join(' ');

  if (hay.includes(q)) return true;
  if (digits.length >= 3 && hay.replace(/\D/g, '').includes(digits)) return true;
  return false;
}

module.exports = {
  formatCurrency,
  formatDateTime,
  escolherConsignacaoElegivel,
  buildLocatorResult,
  matchesQuery,
  pickDocumento,
  pickTelefone,
  pickCidade,
  pickSaldo,
  pickStatus
};
