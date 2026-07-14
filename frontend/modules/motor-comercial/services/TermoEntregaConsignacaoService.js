/**
 * Termo de Entrega de Consignação — serviço corporativo
 *
 * Sprint S-6.3: geração, visualização, impressão e PDF.
 *
 * @module frontend/modules/motor-comercial/services/TermoEntregaConsignacaoService
 */

const { PdfExportService } = require('../utils/exportacao');
const Modal = require('../components/navigation/Modal');
const Button = require('../components/base/Button');
const {
  montarDadosTermo,
  formatCurrency,
  escapeHtml
} = require('./termoEntregaMappers');
const {
  carregarConsignacaoCompleta,
  buscarClientePorIdErp,
  fetchErp,
  choiceDialog,
  notify
} = require('../utils/operacional');
const { getUsuarioId } = require('../api/helpers');

function openModal(backdrop) {
  requestAnimationFrame(() => {
    backdrop.classList.add('cds-modal-backdrop--open', 'is-open');
  });
  document.body.appendChild(backdrop);
}

function closeModal(backdrop) {
  backdrop.classList.remove('cds-modal-backdrop--open', 'is-open');
  setTimeout(() => backdrop.remove(), 250);
}

function ensureTermoModalStyles() {
  if (typeof document === 'undefined') return;
  let style = document.getElementById('cds-termo-modal-styles');
  if (!style) {
    style = document.createElement('style');
    style.id = 'cds-termo-modal-styles';
    document.head.appendChild(style);
  }
  style.textContent = `
    .cds-modal--termo-entrega {
      max-width: min(920px, 96vw) !important;
      width: 96%;
      max-height: 92vh !important;
      height: 92vh;
      opacity: 1;
    }
    .cds-modal-backdrop.cds-modal-backdrop--open .cds-modal--termo-entrega,
    .cds-modal-backdrop.is-open .cds-modal--termo-entrega {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    .cds-modal--termo-entrega .cds-modal__body {
      padding: 0 !important;
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .cds-termo-iframe {
      flex: 1 1 auto;
      width: 100%;
      height: 100%;
      min-height: 360px;
      border: 0;
      background: #fff;
      display: block;
    }
    @media print {
      .cds-modal-backdrop { display: none !important; }
    }
  `;
}

/**
 * Injeta o HTML completo no iframe (evita truncamento de srcdoc/outerHTML).
 * @param {HTMLIFrameElement} iframe
 * @param {string} html
 * @returns {() => void} cleanup
 */
function injetarHtmlNoIframe(iframe, html) {
  let objectUrl = null;

  const tentarWrite = () => {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return false;
      doc.open();
      doc.write(html);
      doc.close();
      return true;
    } catch (_error) {
      return false;
    }
  };

  if (!tentarWrite()) {
    objectUrl = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    iframe.src = objectUrl;
  }

  return () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
  };
}

const DECLARACAO_PADRAO = 'Declaro que recebi os produtos acima relacionados em consignação, comprometendo-me a prestar contas das mercadorias recebidas conforme as condições comerciais acordadas entre as partes.';

function getUsuarioNome() {
  if (typeof localStorage === 'undefined') return '-';
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.nome || user?.username || user?.name || (getUsuarioId() ? `Usuário #${getUsuarioId()}` : '-');
  } catch (_error) {
    return '-';
  }
}

async function carregarDadosEmpresa() {
  try {
    const rows = await fetchErp('/configuracoes');
    const map = {};
    (Array.isArray(rows) ? rows : []).forEach((row) => {
      if (row?.chave) map[row.chave] = row.valor;
    });
    return {
      nome: map.nome_empresa || 'CDS / Cremolicia',
      cnpj: map.cnpj || '',
      telefone: map.telefone || '',
      endereco: map.endereco || ''
    };
  } catch (_error) {
    return {
      nome: 'CDS / Cremolicia',
      cnpj: '',
      telefone: '',
      endereco: ''
    };
  }
}

async function montarDadosTermoCompleto(api, projectionApi, consignacaoId, extras = {}) {
  const consignacao = await carregarConsignacaoCompleta(api, projectionApi, consignacaoId);
  const cliente = consignacao?.clienteId
    ? await buscarClientePorIdErp(consignacao.clienteId)
    : null;
  const empresa = await carregarDadosEmpresa();

  return montarDadosTermo({
    consignacao,
    cliente,
    empresa,
    organizacao: {
      empresa: extras.empresa,
      filial: extras.filial
    },
    usuario: {
      id: getUsuarioId(),
      nome: getUsuarioNome()
    }
  });
}

function buildTermoHtml(dados) {
  const rows = (dados.itens || []).map((item) => `
    <tr>
      <td>${escapeHtml(item.produto)}</td>
      <td>${escapeHtml(item.codigo)}</td>
      <td style="text-align:center">${item.quantidade}</td>
      <td style="text-align:right">${formatCurrency(item.precoUnitario)}</td>
      <td style="text-align:right">${formatCurrency(item.valorTotal)}</td>
    </tr>
  `).join('');

  const docExternoHtml = dados.documentoExterno
    ? `<div><strong>Documento Externo:</strong> ${escapeHtml(dados.documentoExterno)}</div>`
    : '<div></div>';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(dados.titulo)}</title>
  <style>
    @page { size: A4 portrait; margin: 18mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 11pt;
      color: #111;
      margin: 0;
      padding: 18mm;
      line-height: 1.45;
    }
    h1 {
      text-align: center;
      font-size: 16pt;
      margin: 0 0 18px;
      letter-spacing: 0.5px;
    }
    .section { margin-bottom: 16px; }
    .section h2 {
      font-size: 11pt;
      margin: 0 0 8px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .grid-2 {
      display: block;
      width: 100%;
    }
    .grid-2 > div {
      display: inline-block;
      vertical-align: top;
      width: 48%;
      margin: 0 2% 8px 0;
      color: #111;
      font-size: 11pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th, td {
      border: 1px solid #bbb;
      padding: 6px 8px;
      vertical-align: top;
    }
    th {
      background: #f3f5f8;
      font-size: 10pt;
      text-align: left;
    }
    .totais {
      margin-top: 10px;
      display: flex;
      justify-content: flex-end;
      gap: 24px;
      font-weight: bold;
    }
    .observacoes {
      min-height: 48px;
      border: 1px solid #ccc;
      padding: 8px;
      background: #fafafa;
    }
    .declaracao {
      margin-top: 18px;
      padding: 10px;
      border-left: 3px solid #2952ff;
      background: #f8faff;
      font-style: italic;
    }
    .assinaturas {
      display: flex;
      gap: 40px;
      margin-top: 42px;
    }
    .assinatura {
      flex: 1;
      text-align: center;
      padding-top: 48px;
      border-top: 1px solid #111;
    }
    .assinatura p { margin: 4px 0; }
    .footer {
      margin-top: 28px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      font-size: 9pt;
      color: #666;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(dados.titulo)}</h1>

  <div class="section">
    <h2>Cabeçalho</h2>
    <div class="grid-2">
      <div><strong>Número da Consignação:</strong> ${escapeHtml(dados.numeroConsignacao)}</div>
      <div><strong>Documento Oficial:</strong> ${escapeHtml(dados.documentoOficial)}</div>
      ${docExternoHtml}
      <div><strong>Data:</strong> ${escapeHtml(dados.data)}</div>
      <div><strong>Hora:</strong> ${escapeHtml(dados.hora)}</div>
      <div><strong>Empresa:</strong> ${escapeHtml(dados.empresa.nome)}</div>
      <div><strong>Filial:</strong> ${escapeHtml(dados.empresa.filial)}</div>
    </div>
  </div>

  <div class="section">
    <h2>Consignatário</h2>
    <div class="grid-2">
      <div><strong>Nome:</strong> ${escapeHtml(dados.consignatario.nome)}</div>
      <div><strong>CPF/CNPJ:</strong> ${escapeHtml(dados.consignatario.documento)}</div>
      <div><strong>Endereço:</strong> ${escapeHtml(dados.consignatario.endereco)}</div>
      <div><strong>Cidade:</strong> ${escapeHtml(dados.consignatario.cidade)}</div>
      <div><strong>Telefone:</strong> ${escapeHtml(dados.consignatario.telefone)}</div>
    </div>
  </div>

  <div class="section">
    <h2>Produtos Entregues</h2>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Código</th>
          <th style="width:90px;text-align:center">Quantidade</th>
          <th style="width:110px;text-align:right">Valor Unitário</th>
          <th style="width:110px;text-align:right">Valor Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="5">Nenhum item registrado.</td></tr>'}
      </tbody>
    </table>
    <div class="totais">
      <span>Quantidade Total de Itens: ${dados.quantidadeTotal}</span>
      <span>Valor Total da Consignação: ${formatCurrency(dados.valorTotal)}</span>
    </div>
  </div>

  <div class="section">
    <h2>Observações</h2>
    <div class="observacoes">${escapeHtml(dados.observacoes)}</div>
  </div>

  <div class="declaracao">${escapeHtml(dados.declaracao || DECLARACAO_PADRAO)}</div>

  <div class="assinaturas">
    <div class="assinatura">
      <p><strong>Empresa</strong></p>
      <p>CDS / Cremolicia</p>
      <p>Responsável pela Entrega</p>
    </div>
    <div class="assinatura">
      <p><strong>Consignatário</strong></p>
      <p>Nome: ________________________________</p>
      <p>CPF: ___________________________________</p>
      <p>Assinatura</p>
    </div>
  </div>

  <div class="footer">
    <span>Emissão: ${escapeHtml(dados.emissao)} · Usuário: ${escapeHtml(dados.usuario)}</span>
    <span>Documento gerado pelo CDS Sistemas</span>
  </div>
</body>
</html>`;
}

function exibirTermoModal(html, { imprimir = false } = {}) {
  if (typeof document === 'undefined') {
    notify('Visualização indisponível neste ambiente.', 'warning');
    return false;
  }

  ensureTermoModalStyles();

  const iframe = document.createElement('iframe');
  iframe.className = 'cds-termo-iframe';
  iframe.title = 'Termo de Entrega de Consignação';
  // about:blank — conteúdo injetado via document.write após o mount (HTML completo)

  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.gap = '8px';
  footer.style.justifyContent = 'flex-end';

  let backdrop;
  let cleanupIframe = () => {};

  const fechar = () => {
    cleanupIframe();
    if (backdrop) closeModal(backdrop);
  };

  const imprimirIframe = () => {
    try {
      const win = iframe.contentWindow;
      if (!win) {
        notify('Não foi possível iniciar a impressão.', 'error');
        return;
      }
      win.focus();
      win.print();
    } catch (_error) {
      notify('Não foi possível iniciar a impressão.', 'error');
    }
  };

  footer.appendChild(Button.create({
    text: 'Imprimir',
    variant: 'primary',
    onClick: imprimirIframe
  }));
  footer.appendChild(Button.create({
    text: 'Fechar',
    variant: 'secondary',
    onClick: fechar
  }));

  backdrop = Modal.create({
    title: 'Termo de Entrega de Consignação',
    content: iframe,
    footer,
    open: false,
    onClose: fechar
  });

  const modal = backdrop.querySelector('.cds-modal');
  if (modal) modal.classList.add('cds-modal--termo-entrega');

  openModal(backdrop);

  // Injeta após o iframe estar no DOM — garante cabeçalho, itens, totais e assinaturas
  requestAnimationFrame(() => {
    cleanupIframe = injetarHtmlNoIframe(iframe, html);
    if (imprimir) {
      setTimeout(imprimirIframe, 400);
    }
  });

  return true;
}

function exportarPdfTermo(dados) {
  if (!PdfExportService.isAvailable()) {
    return { ok: false, message: 'Exportação PDF indisponível.' };
  }

  const created = PdfExportService.createDocument({ orientation: 'portrait' });
  if (!created.ok) return created;

  const { doc, lib } = created;
  const margin = 40;
  let y = 40;

  const line = (text, size = 10, bold = false) => {
    doc.setFontSize(size);
    if (bold) doc.setFont(undefined, 'bold');
    else doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(String(text), 515);
    if (y + lines.length * (size + 2) > 760) {
      doc.addPage();
      y = 40;
    }
    doc.text(lines, margin, y);
    y += lines.length * (size + 2) + 4;
  };

  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text(dados.titulo, 297.5, y, { align: 'center' });
  y += 24;
  doc.setFont(undefined, 'normal');

  line(`Nº Consignação: ${dados.numeroConsignacao}  |  Documento: ${dados.documentoOficial}`, 9);
  if (dados.documentoExterno) line(`Documento Externo: ${dados.documentoExterno}`, 9);
  line(`Data: ${dados.data}  |  Hora: ${dados.hora}  |  Empresa: ${dados.empresa.nome}  |  Filial: ${dados.empresa.filial}`, 9);
  y += 4;

  line('CONSIGNATÁRIO', 10, true);
  line(`Nome: ${dados.consignatario.nome}`, 9);
  line(`CPF/CNPJ: ${dados.consignatario.documento}  |  Telefone: ${dados.consignatario.telefone}`, 9);
  line(`Endereço: ${dados.consignatario.endereco}  |  Cidade: ${dados.consignatario.cidade}`, 9);
  y += 4;

  const applied = PdfExportService.applyAutoTable(doc, lib, {
    head: [['Produto', 'Código', 'Qtd', 'Vlr Unit.', 'Vlr Total']],
    body: (dados.itens || []).map((item) => [
      item.produto,
      item.codigo,
      String(item.quantidade),
      formatCurrency(item.precoUnitario),
      formatCurrency(item.valorTotal)
    ]),
    startY: y,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [41, 98, 255] },
    margin: { left: margin, right: margin }
  });
  if (!applied.ok) return applied;

  y = (doc.lastAutoTable?.finalY || y) + 14;
  line(`Quantidade Total de Itens: ${dados.quantidadeTotal}`, 9, true);
  line(`Valor Total da Consignação: ${formatCurrency(dados.valorTotal)}`, 9, true);
  y += 6;
  line('OBSERVAÇÕES', 10, true);
  line(dados.observacoes, 9);
  y += 6;
  line(dados.declaracao || DECLARACAO_PADRAO, 9);
  y += 20;

  const signY = Math.min(Math.max(y, 560), 640);
  doc.line(margin, signY, 260, signY);
  doc.line(335, signY, 555, signY);
  doc.setFontSize(8);
  doc.text('Empresa — CDS / Cremolicia', margin, signY + 12);
  doc.text('Responsável pela Entrega', margin, signY + 22);
  doc.text('Consignatário — Nome / CPF / Assinatura', 335, signY + 12);

  PdfExportService.addFooter(doc, `Usuário: ${dados.usuario} — CDS Sistemas`);
  doc.save(dados.filename.endsWith('.pdf') ? dados.filename : `${dados.filename}.pdf`);
  return { ok: true };
}

async function registrarEmissao(api, consignacaoId, acao = 'impressao') {
  try {
    await api.registrarEmissaoTermoEntrega(consignacaoId, { acao });
  } catch (error) {
    console.warn('[TermoEntrega] Falha ao registrar emissão:', error.message);
  }
}

async function visualizarTermo(api, projectionApi, consignacaoId, extras = {}) {
  const dados = await montarDadosTermoCompleto(api, projectionApi, consignacaoId, extras);
  const html = buildTermoHtml(dados);
  exibirTermoModal(html, { imprimir: false });
  await registrarEmissao(api, consignacaoId, 'visualizar');
  return { ok: true, dados };
}

async function imprimirTermo(api, projectionApi, consignacaoId, extras = {}) {
  const dados = await montarDadosTermoCompleto(api, projectionApi, consignacaoId, extras);
  const html = buildTermoHtml(dados);
  exibirTermoModal(html, { imprimir: true });
  await registrarEmissao(api, consignacaoId, 'impressao');
  return { ok: true, dados };
}

async function exportarTermoPdf(api, projectionApi, consignacaoId, extras = {}) {
  const dados = await montarDadosTermoCompleto(api, projectionApi, consignacaoId, extras);
  const result = exportarPdfTermo(dados);
  if (result.ok) await registrarEmissao(api, consignacaoId, 'pdf');
  else notify(result.message || 'Erro ao exportar PDF.', 'error');
  return result;
}

async function exibirDialogoTermoEntrega(options = {}) {
  const title = options.title || 'Consignação criada com sucesso';
  const message = options.message || 'Deseja imprimir o Termo de Entrega?';
  return choiceDialog({
    title,
    message,
    choices: [
      { label: 'Imprimir Agora', value: 'imprimir', variant: 'primary' },
      { label: 'Imprimir Depois', value: 'depois', variant: 'secondary' },
      { label: 'Fechar', value: 'fechar', variant: 'ghost' }
    ]
  });
}

async function processarEscolhaTermo(escolha, api, projectionApi, consignacaoId, extras = {}) {
  if (escolha === 'imprimir') {
    await imprimirTermo(api, projectionApi, consignacaoId, extras);
    return;
  }
  if (escolha === 'depois') {
    notify('Você pode imprimir o Termo de Entrega a qualquer momento nos detalhes da consignação.', 'info');
  }
}

module.exports = {
  montarDadosTermoCompleto,
  buildTermoHtml,
  exibirTermoModal,
  visualizarTermo,
  imprimirTermo,
  exportarTermoPdf,
  registrarEmissao,
  exibirDialogoTermoEntrega,
  processarEscolhaTermo
};
