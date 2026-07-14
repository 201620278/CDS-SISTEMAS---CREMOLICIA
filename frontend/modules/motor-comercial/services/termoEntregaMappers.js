/**
 * Mapeadores do Termo de Entrega de Consignação — Sprint S-6.3
 *
 * @module frontend/modules/motor-comercial/services/termoEntregaMappers
 */

const { obterOpcoesOrganizacao } = require('../config/comercialOrganizacao');

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(Number(value) || 0);
}

function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('pt-BR');
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatClienteEndereco(cliente = {}) {
  if (cliente.endereco) return cliente.endereco;
  const partes = [cliente.rua, cliente.numero, cliente.bairro, cliente.complemento]
    .filter(Boolean);
  return partes.join(', ') || '-';
}

function formatDocumentoConsignacao(documento) {
  if (!documento) return '-';
  if (typeof documento === 'string') return documento;
  return documento.numero || documento.situacao || '-';
}

function normalizeItensTermo(itens = []) {
  return (itens || []).map((item) => {
    const quantidade = Number(item.quantidadeEntregue ?? item.quantidade ?? 0);
    const precoUnitario = Number(item.precoUnitario ?? item.preco ?? 0);
    return {
      produto: item.produtoNome || item.produto || item.descricao || `Produto #${item.produtoId}`,
      codigo: item.codigo || item.produtoCodigo || String(item.produtoId || ''),
      quantidade,
      precoUnitario,
      valorTotal: quantidade * precoUnitario
    };
  });
}

function calcularTotaisTermo(itens = []) {
  const normalizados = normalizeItensTermo(itens);
  const quantidadeTotal = normalizados.reduce((sum, item) => sum + item.quantidade, 0);
  const valorTotal = normalizados.reduce((sum, item) => sum + item.valorTotal, 0);
  return { itens: normalizados, quantidadeTotal, valorTotal };
}

function resolverOrganizacao(empresaValue, filialValue) {
  const org = obterOpcoesOrganizacao();
  const empresa = org.empresas.find((e) => e.value === empresaValue) || org.empresas[0];
  const filial = org.filiais.find((f) => f.value === filialValue) || org.filiais[0];
  return {
    empresa: empresa?.label || 'Cremolicia',
    filial: filial?.label || 'Matriz'
  };
}

function montarDadosTermo({
  consignacao = {},
  cliente = null,
  empresa = {},
  organizacao = {},
  usuario = {},
  emissao = new Date()
}) {
  const { itens, quantidadeTotal, valorTotal } = calcularTotaisTermo(consignacao.itens);
  const org = resolverOrganizacao(organizacao.empresa, organizacao.filial);
  const observacoes = String(consignacao.observacao || consignacao.observacoes || '').trim();

  return {
    titulo: 'TERMO DE ENTREGA DE CONSIGNAÇÃO',
    consignacaoId: consignacao.id,
    numeroConsignacao: consignacao.id,
    documentoOficial: formatDocumentoConsignacao(consignacao.documento),
    documentoExterno: consignacao.documentoExterno || null,
    data: formatDate(consignacao.dataEntrega || consignacao.dataAbertura || emissao),
    hora: formatTime(consignacao.dataEntrega || emissao),
    empresa: {
      nome: empresa.nome || org.empresa,
      cnpj: empresa.cnpj || '',
      telefone: empresa.telefone || '',
      endereco: empresa.endereco || '',
      filial: org.filial
    },
    consignatario: {
      nome: cliente?.nome || consignacao.clienteNome || consignacao.cliente || '-',
      documento: cliente?.cpf_cnpj || cliente?.cpf || cliente?.documento || '-',
      endereco: formatClienteEndereco(cliente || {}),
      cidade: cliente?.cidade ? `${cliente.cidade}${cliente.uf ? `/${cliente.uf}` : ''}` : '-',
      telefone: cliente?.telefone || '-'
    },
    itens,
    quantidadeTotal,
    valorTotal,
    observacoes: observacoes || 'Sem observações.',
    declaracao: 'Declaro que recebi os produtos acima relacionados em consignação, comprometendo-me a prestar contas das mercadorias recebidas conforme as condições comerciais acordadas entre as partes.',
    usuario: usuario.nome || usuario.id || '-',
    emissao: formatDateTime(emissao),
    filename: `termo-entrega-${formatDocumentoConsignacao(consignacao.documento).replace(/[^\w-]+/g, '-') || consignacao.id}.pdf`
  };
}

module.exports = {
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  escapeHtml,
  formatClienteEndereco,
  formatDocumentoConsignacao,
  normalizeItensTermo,
  calcularTotaisTermo,
  resolverOrganizacao,
  montarDadosTermo
};
