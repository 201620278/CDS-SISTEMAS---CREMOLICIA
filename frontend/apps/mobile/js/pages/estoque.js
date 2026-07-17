/**
 * CDS Mobile RC2 — Estoque operacional
 * Ajustes apenas via POST /produtos/:id/ajustar-estoque (Motor de Estoque).
 */
import {
  escapeHtml,
  asText,
  formatNumber,
  formatDateTime,
  loadingHtml,
  emptyHtml,
  errorHtml,
  searchBarHtml,
  listCardHtml,
  sectionTitleHtml,
  backBarHtml,
  bindBack,
  bindGo,
  debounce,
  countLabel,
  icon
} from '../ui.js';
import { fieldHtml, promptSheet, confirmSheet } from '../forms.js';
import { showToast } from '../toast.js';
import { canDoAction } from '../permissions.js';

const PAGE_SIZE = 20;

function estoqueValor(p) {
  for (const k of ['estoque', 'estoque_exibido', 'estoque_atual', 'saldo_fiscal', 'quantidade']) {
    if (p[k] != null && p[k] !== '') return Number(p[k]);
  }
  return 0;
}

function unwrapItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function cardProduto(p) {
  const estoque = estoqueValor(p);
  const min = Number(p.estoque_minimo ?? p.minimo ?? 0);
  const baixo = Number.isFinite(min) && min > 0 && estoque <= min;
  return listCardHtml({
    go: `estoque/${p.id}`,
    title: asText(p.nome || p.descricao, 'Produto'),
    subtitle: asText(p.codigo || p.sku || p.codigo_barras || p.id),
    value: formatNumber(estoque, 2),
    status: baixo ? 'Baixo' : null,
    meta: [
      `Fiscal ${formatNumber(p.saldo_fiscal ?? 0, 2)}`,
      `Não fiscal ${formatNumber(p.saldo_nao_fiscal ?? 0, 2)}`
    ]
  });
}

function parseQty(raw) {
  return Number(String(raw || '0').replace(/\./g, '').replace(',', '.')) || 0;
}

async function executarAjuste(produtoId, { ajuste_fiscal, ajuste_nao_fiscal, motivo }) {
  return window.CDSApi.post(`produtos/${produtoId}/ajustar-estoque`, {
    ajuste_fiscal,
    ajuste_nao_fiscal,
    motivo
  });
}

async function sheetAjuste(produto, tipo) {
  const nome = asText(produto.nome, 'Produto');
  const fiscal = Number(produto.saldo_fiscal || 0);
  const naoFiscal = Number(produto.saldo_nao_fiscal || 0);

  if (tipo === 'inventario') {
    const data = await promptSheet({
      title: `Inventário · ${nome}`,
      confirmLabel: 'Aplicar inventário',
      fieldsHtml: [
        fieldHtml({ name: 'saldo_fiscal', label: 'Saldo fiscal contado', value: fiscal, inputmode: 'decimal' }),
        fieldHtml({ name: 'saldo_nao_fiscal', label: 'Saldo não fiscal contado', value: naoFiscal, inputmode: 'decimal' }),
        fieldHtml({ name: 'motivo', label: 'Motivo', value: 'Inventário mobile', required: true, type: 'textarea' })
      ].join('')
    });
    if (!data) return null;
    const novoF = parseQty(data.saldo_fiscal);
    const novoNF = parseQty(data.saldo_nao_fiscal);
    return {
      ajuste_fiscal: novoF - fiscal,
      ajuste_nao_fiscal: novoNF - naoFiscal,
      motivo: data.motivo || 'Inventário mobile'
    };
  }

  const labels = {
    entrada: { title: 'Entrada manual', sign: 1, motivo: 'Entrada manual mobile' },
    saida: { title: 'Saída manual', sign: -1, motivo: 'Saída manual mobile' },
    ajuste: { title: 'Ajuste de estoque', sign: 1, motivo: 'Ajuste mobile' }
  };
  const cfg = labels[tipo] || labels.ajuste;

  const data = await promptSheet({
    title: `${cfg.title} · ${nome}`,
    confirmLabel: 'Confirmar',
    fieldsHtml: [
      fieldHtml({
        name: 'quantidade',
        label: tipo === 'ajuste' ? 'Quantidade (+/-)' : 'Quantidade',
        inputmode: 'decimal',
        required: true
      }),
      fieldHtml({
        name: 'destino',
        label: 'Destino',
        type: 'select',
        value: [
          { value: 'nao_fiscal', label: 'Não fiscal', selected: true },
          { value: 'fiscal', label: 'Fiscal' }
        ]
      }),
      fieldHtml({ name: 'motivo', label: 'Motivo', value: cfg.motivo, required: true, type: 'textarea' })
    ].join('')
  });
  if (!data) return null;
  let qtd = parseQty(data.quantidade);
  if (tipo === 'saida') qtd = -Math.abs(qtd);
  else if (tipo === 'entrada') qtd = Math.abs(qtd);
  const fiscalDest = data.destino === 'fiscal';
  return {
    ajuste_fiscal: fiscalDest ? qtd : 0,
    ajuste_nao_fiscal: fiscalDest ? 0 : qtd,
    motivo: data.motivo || cfg.motivo
  };
}

async function renderLista(root) {
  root.innerHTML = loadingHtml('Consultando estoque…');
  try {
    let baixo = [];
    let vencimentos = [];
    try {
      baixo = await window.CDSApi.get('produtos/estoque/baixo');
      if (!Array.isArray(baixo)) baixo = [];
    } catch (e) {
      baixo = [];
    }
    try {
      vencimentos = await window.CDSApi.get('produtos/vencimentos/alertas');
      if (!Array.isArray(vencimentos)) vencimentos = vencimentos?.items || vencimentos?.data || [];
    } catch (e) {
      vencimentos = [];
    }

    root.innerHTML = `
      ${searchBarHtml('Buscar produto no estoque', 'estoque-search')}
      ${sectionTitleHtml('Estoque baixo')}
      <p class="cds-muted">${escapeHtml(countLabel(baixo.length, 'alerta', 'alertas'))}</p>
      <div id="estoque-baixo-list">
        ${baixo.length
          ? baixo.slice(0, 40).map((p) => cardProduto(p)).join('')
          : emptyHtml('Nenhum alerta de estoque baixo')}
      </div>
      ${sectionTitleHtml('Validade')}
      <div>
        ${vencimentos.length
          ? vencimentos.slice(0, 30).map((p) => listCardHtml({
              go: `estoque/${p.id || p.produto_id}`,
              title: asText(p.nome || p.produto_nome, 'Produto'),
              subtitle: asText(p.lote || p.codigo),
              meta: [`Val ${asText(p.data_validade || p.validade)}`]
            })).join('')
          : emptyHtml('Sem alertas de validade')}
      </div>
      ${sectionTitleHtml('Consulta')}
      <div id="estoque-list">${emptyHtml('Digite para buscar')}</div>
      ${canDoAction('ajuste_estoque')
        ? `<p class="cds-muted">Abra um produto para entrada, saída, inventário ou ajuste.</p>`
        : `<p class="cds-muted">Sem permissão para ajustar estoque.</p>`}
    `;
    bindGo(root);

    root.querySelector('#estoque-search')?.addEventListener('input', debounce(async (e) => {
      const q = String(e.target.value || '').trim();
      const list = root.querySelector('#estoque-list');
      if (q.length < 2) {
        list.innerHTML = emptyHtml('Digite para buscar');
        return;
      }
      list.innerHTML = loadingHtml('Buscando…');
      try {
        const payload = await window.CDSApi.get('produtos/search', { q, limite: PAGE_SIZE });
        const items = unwrapItems(payload);
        list.innerHTML = items.length
          ? items.map((p) => cardProduto(p)).join('')
          : emptyHtml('Nenhum produto');
        bindGo(list);
      } catch (err) {
        list.innerHTML = errorHtml(err.message, err.status);
      }
    }, 280));
  } catch (err) {
    root.innerHTML = errorHtml(err.message, err.status);
  }
}

async function renderDetail(root, id) {
  root.innerHTML = loadingHtml('Carregando…');
  try {
    const p = await window.CDSApi.get(`produtos/${id}`);
    let hist = [];
    try {
      hist = await window.CDSApi.get(`produtos/${id}/historico-estoque`);
      if (!Array.isArray(hist)) hist = hist?.data || hist?.items || [];
    } catch (e) {
      hist = [];
    }

    const pode = canDoAction('ajuste_estoque');

    root.innerHTML = `
      ${backBarHtml('Estoque')}
      <article class="cds-card cds-m-enter">
        <h2 style="margin:0 0 8px;font-size:1.15rem">${escapeHtml(asText(p.nome))}</h2>
        <div class="cds-row"><span>Código</span><strong>${escapeHtml(asText(p.codigo || p.codigo_barras))}</strong></div>
        <div class="cds-row"><span>Total</span><strong>${escapeHtml(formatNumber(estoqueValor(p), 2))}</strong></div>
        <div class="cds-row"><span>Fiscal</span><strong>${escapeHtml(formatNumber(p.saldo_fiscal ?? 0, 2))}</strong></div>
        <div class="cds-row"><span>Não fiscal</span><strong>${escapeHtml(formatNumber(p.saldo_nao_fiscal ?? 0, 2))}</strong></div>
        <div class="cds-row"><span>Mínimo</span><strong>${escapeHtml(formatNumber(p.estoque_minimo ?? 0, 2))}</strong></div>
      </article>

      ${pode ? `
        <div class="cds-stack" style="margin-top:12px;gap:8px">
          <button type="button" class="cds-mobile-btn" data-op="entrada">${icon('plus')} Entrada</button>
          <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" data-op="saida">Saída</button>
          <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" data-op="inventario">Inventário</button>
          <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" data-op="ajuste">Ajuste (+/-)</button>
        </div>
        <p class="cds-muted">Transferência entre depósitos: sem API dedicada — use saída + entrada (matriz ⚠).</p>
      ` : ''}

      ${sectionTitleHtml('Movimentações')}
      <div>
        ${hist.length
          ? hist.slice(0, 30).map((h) => listCardHtml({
              title: asText(h.motivo || h.tipo || 'Movimento'),
              value: formatNumber(h.ajuste_fiscal ?? h.ajuste_nao_fiscal ?? h.quantidade ?? h.delta ?? 0, 2),
              meta: [
                `F ${formatNumber(h.ajuste_fiscal ?? 0, 2)}`,
                `NF ${formatNumber(h.ajuste_nao_fiscal ?? 0, 2)}`,
                formatDateTime(h.criado_em || h.created_at || h.data)
              ]
            })).join('')
          : emptyHtml('Sem histórico')}
      </div>
    `;
    bindBack(root);

    root.querySelectorAll('[data-op]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const tipo = btn.getAttribute('data-op');
        try {
          const body = await sheetAjuste(p, tipo);
          if (!body) return;
          if (body.ajuste_fiscal === 0 && body.ajuste_nao_fiscal === 0) {
            showToast('Nenhuma alteração de saldo.', 'warning');
            return;
          }
          const ok = await confirmSheet({
            title: 'Confirmar ajuste',
            message: `Fiscal ${body.ajuste_fiscal} · Não fiscal ${body.ajuste_nao_fiscal}`,
            confirmLabel: 'Aplicar'
          });
          if (!ok) return;
          await executarAjuste(id, body);
          showToast('Estoque ajustado.', 'success');
          window.CDSMobile?.navigate?.(`estoque/${id}`, { replace: true });
        } catch (err) {
          showToast(err.message || 'Falha no ajuste', 'error');
        }
      });
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Voltar')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

export async function render(root, parsed) {
  const parts = parsed?.parts || [];
  if (parts[1]) return renderDetail(root, parts[1]);
  return renderLista(root);
}

export default { render, title: 'Estoque', subtitle: 'Operacional' };
