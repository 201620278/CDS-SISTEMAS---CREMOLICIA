/**
 * Comprovante de Fechamento — Sprint UX-05.
 *
 * @module frontend/modules/motor-comercial/services/ComprovanteFechamentoService
 */

const Modal = require('../components/navigation/Modal');
const Button = require('../components/base/Button');
const { PdfExportService } = require('../utils/exportacao');
const { notify, fetchErp } = require('../utils/operacional');
const { getUsuarioId } = require('../api/helpers');
const { formatCurrency } = require('../pages/PrestacaoContas/fecharConsignacaoMappers');

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getUsuarioNome() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.nome || user?.username || (getUsuarioId() ? `Operador #${getUsuarioId()}` : '—');
  } catch {
    return '—';
  }
}

async function carregarDadosEmpresa() {
  try {
    const rows = await fetchErp('/configuracoes');
    const map = {};
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      if (row?.chave) map[row.chave] = row.valor;
    });
    return { nome: map.nome_empresa || 'CDS / Cremolicia', cnpj: map.cnpj || '' };
  } catch {
    return { nome: 'CDS / Cremolicia', cnpj: '' };
  }
}

function montarDadosComprovante({ consignacao = {}, painel = {} } = {}) {
  const agora = new Date();
  return {
    titulo: 'Comprovante de Fechamento',
    numeroConsignacao: consignacao.documento || '—',
    cliente: consignacao.clienteNome || consignacao.cliente || '—',
    produtosVendidos: painel.produtosVendidos ?? 0,
    produtosDevolvidos: painel.produtosDevolvidos ?? 0,
    perdas: painel.perdas ?? 0,
    cortesias: painel.cortesias ?? 0,
    valorRecebido: painel.valorRecebido ?? 0,
    saldo: painel.saldoFinal ?? 0,
    data: agora.toLocaleDateString('pt-BR'),
    hora: agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    operador: getUsuarioNome(),
    empresa: '',
    filename: `comprovante-fechamento-${consignacao.documento || consignacao.id || 'doc'}.pdf`
  };
}

async function montarDadosComprovanteCompleto(consignacao, resumo, painel) {
  const empresa = await carregarDadosEmpresa();
  const dados = montarDadosComprovante({ consignacao, painel });
  dados.empresa = empresa.nome;
  return dados;
}

function buildComprovanteHtml(dados) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(dados.titulo)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #111; margin: 0; padding: 18mm; line-height: 1.45; }
    h1 { text-align: center; font-size: 16pt; margin: 0 0 20px; }
    .section { margin-bottom: 16px; }
    .section h2 { font-size: 11pt; margin: 0 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; text-transform: uppercase; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; }
    .totais { margin-top: 16px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
    .totais strong { display: block; margin-bottom: 4px; }
    .assinaturas { display: flex; gap: 40px; margin-top: 48px; }
    .assinatura { flex: 1; text-align: center; padding-top: 48px; border-top: 1px solid #111; }
    .footer { margin-top: 28px; font-size: 9pt; color: #666; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(dados.titulo)}</h1>
  <div class="section">
    <h2>Dados do Atendimento</h2>
    <div class="grid">
      <div><strong>Consignação:</strong> ${escapeHtml(dados.numeroConsignacao)}</div>
      <div><strong>Cliente:</strong> ${escapeHtml(dados.cliente)}</div>
      <div><strong>Data:</strong> ${escapeHtml(dados.data)}</div>
      <div><strong>Hora:</strong> ${escapeHtml(dados.hora)}</div>
      <div><strong>Operador:</strong> ${escapeHtml(dados.operador)}</div>
      <div><strong>Empresa:</strong> ${escapeHtml(dados.empresa)}</div>
    </div>
  </div>
  <div class="section">
    <h2>Resumo de Produtos</h2>
    <div class="grid">
      <div><strong>Vendidos:</strong> ${dados.produtosVendidos} un.</div>
      <div><strong>Devolvidos:</strong> ${dados.produtosDevolvidos} un.</div>
      <div><strong>Perdas:</strong> ${dados.perdas} un.</div>
      <div><strong>Cortesias:</strong> ${dados.cortesias} un.</div>
    </div>
  </div>
  <div class="totais">
    <strong>Valor Recebido: ${formatCurrency(dados.valorRecebido)}</strong>
    <strong>Saldo Final: ${formatCurrency(dados.saldo)}</strong>
  </div>
  <div class="assinaturas">
    <div class="assinatura"><p><strong>Empresa</strong></p><p>Responsável</p></div>
    <div class="assinatura"><p><strong>Cliente</strong></p><p>Assinatura</p></div>
  </div>
  <div class="footer">
    <span>Emissão: ${escapeHtml(dados.data)} ${escapeHtml(dados.hora)}</span>
    <span>CDS Sistemas</span>
  </div>
</body>
</html>`;
}

function exibirComprovanteModal(html, { imprimir = false } = {}) {
  if (typeof document === 'undefined') {
    notify('Visualização indisponível.', 'warning');
    return false;
  }

  const iframe = document.createElement('iframe');
  iframe.title = 'Comprovante de Fechamento';
  iframe.setAttribute('srcdoc', html);
  iframe.style.cssText = 'width:100%;height:75vh;border:0;';

  let backdrop;
  const fechar = () => {
    if (backdrop) {
      backdrop.classList.remove('cds-modal-backdrop--open', 'is-open');
      setTimeout(() => backdrop.remove(), 250);
    }
  };

  const imprimirIframe = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      notify('Não foi possível imprimir.', 'error');
    }
  };

  const footer = document.createElement('div');
  footer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';
  footer.appendChild(Button.create({ text: 'Imprimir', variant: 'primary', onClick: imprimirIframe }));
  footer.appendChild(Button.create({ text: 'Fechar', variant: 'secondary', onClick: fechar }));

  backdrop = Modal.create({
    title: 'Comprovante de Fechamento',
    content: iframe,
    footer,
    open: false,
    onClose: fechar
  });

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('cds-modal-backdrop--open', 'is-open'));

  if (imprimir) {
    iframe.addEventListener('load', () => setTimeout(imprimirIframe, 350), { once: true });
  }

  return true;
}

function exportarPdfComprovante(dados) {
  if (!PdfExportService.isAvailable()) {
    return { ok: false, message: 'Exportação PDF indisponível.' };
  }

  const created = PdfExportService.createDocument({ orientation: 'portrait' });
  if (!created.ok) return created;

  const { doc } = created;
  let y = 40;
  const line = (text, size = 10, bold = false) => {
    doc.setFontSize(size);
    doc.setFont(undefined, bold ? 'bold' : 'normal');
    doc.text(String(text), 40, y);
    y += size + 6;
  };

  line(dados.titulo, 14, true);
  y += 8;
  line(`Consignação: ${dados.numeroConsignacao}`, 10);
  line(`Cliente: ${dados.cliente}`, 10);
  line(`Data: ${dados.data}  Hora: ${dados.hora}`, 9);
  line(`Operador: ${dados.operador}  Empresa: ${dados.empresa}`, 9);
  y += 6;
  line('PRODUTOS', 10, true);
  line(`Vendidos: ${dados.produtosVendidos}  Devolvidos: ${dados.produtosDevolvidos}`, 9);
  line(`Perdas: ${dados.perdas}  Cortesias: ${dados.cortesias}`, 9);
  y += 6;
  line(`Valor Recebido: ${formatCurrency(dados.valorRecebido)}`, 10, true);
  line(`Saldo Final: ${formatCurrency(dados.saldo)}`, 10, true);

  doc.save(dados.filename.endsWith('.pdf') ? dados.filename : `${dados.filename}.pdf`);
  return { ok: true };
}

async function imprimirComprovante(consignacao, resumo, painel) {
  const dados = await montarDadosComprovanteCompleto(consignacao, resumo, painel);
  exibirComprovanteModal(buildComprovanteHtml(dados), { imprimir: true });
  return { ok: true, dados };
}

async function visualizarComprovante(consignacao, resumo, painel) {
  const dados = await montarDadosComprovanteCompleto(consignacao, resumo, painel);
  exibirComprovanteModal(buildComprovanteHtml(dados), { imprimir: false });
  return { ok: true, dados };
}

async function exportarComprovantePdf(consignacao, resumo, painel) {
  const dados = await montarDadosComprovanteCompleto(consignacao, resumo, painel);
  const result = exportarPdfComprovante(dados);
  if (!result.ok) notify(result.message || 'Erro ao exportar PDF.', 'error');
  return result;
}

module.exports = {
  montarDadosComprovante,
  buildComprovanteHtml,
  imprimirComprovante,
  visualizarComprovante,
  exportarComprovantePdf
};
