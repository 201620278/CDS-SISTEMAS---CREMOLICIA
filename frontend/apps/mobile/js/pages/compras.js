/**
 * CDS Mobile RC2.2 — Compras (paridade ERP via /api/compras)
 */
import {
  escapeHtml,
  asText,
  formatMoney,
  formatDate,
  loadingHtml,
  emptyHtml,
  errorHtml,
  listCardHtml,
  backBarHtml,
  bindBack,
  bindGo,
  sectionTitleHtml,
  countLabel,
  searchBarHtml,
  debounce
} from '../ui.js';
import {
  fieldHtml,
  formCardHtml,
  collectForm,
  fabHtml,
  actionBarHtml,
  confirmSheet,
  promptSheet,
  unwrapList
} from '../forms.js';
import { showToast } from '../toast.js';

function cardCompra(c) {
  return listCardHtml({
    go: `compras/${c.id}`,
    title: asText(c.fornecedor || c.numero_nf || `Compra #${c.id}`, 'Compra'),
    value: formatMoney(c.total ?? c.valor_total_nota ?? 0),
    status: c.status || c.situacao,
    meta: [
      formatDate(c.data_compra || c.data_entrada || c.created_at),
      asText(c.numero_nf, '')
    ].filter((x) => x && x !== '—')
  });
}

export async function renderList(root) {
  root.innerHTML = `
    ${searchBarHtml('Buscar fornecedor ou NF', 'compras-search')}
    <p class="cds-muted" id="compras-count">Carregando…</p>
    <div id="compras-list">${loadingHtml()}</div>
    ${fabHtml('Nova compra', 'compras/nova')}
  `;
  const list = root.querySelector('#compras-list');
  const count = root.querySelector('#compras-count');

  const load = async (busca = '') => {
    list.innerHTML = loadingHtml();
    try {
      let rows = unwrapList(await window.CDSApi.get('compras'));
      if (busca) {
        const q = busca.toLowerCase();
        rows = rows.filter((c) => JSON.stringify(c).toLowerCase().includes(q));
      }
      count.textContent = countLabel(rows.length, 'compra', 'compras');
      list.innerHTML = rows.length
        ? rows.slice(0, 50).map(cardCompra).join('')
        : emptyHtml('Nenhuma compra');
      bindGo(list);
    } catch (err) {
      list.innerHTML = errorHtml(err.message, err.status);
    }
  };

  bindGo(root);
  root.querySelector('#compras-search')?.addEventListener('input', debounce((e) => load(e.target.value), 280));
  await load();
}

export async function renderNova(root) {
  root.innerHTML = `
    ${backBarHtml('Compras')}
    ${formCardHtml(
      'Nova compra (entrada simples)',
      [
        fieldHtml({ name: 'fornecedor', label: 'Fornecedor', required: true }),
        fieldHtml({ name: 'data_compra', label: 'Data', type: 'date', value: new Date().toISOString().slice(0, 10), required: true }),
        fieldHtml({ name: 'numero_nf', label: 'Número NF' }),
        fieldHtml({ name: 'total', label: 'Total', type: 'number', value: 0, required: true, inputmode: 'decimal' }),
        fieldHtml({ name: 'produto_id', label: 'Produto ID', type: 'number', required: true, inputmode: 'numeric' }),
        fieldHtml({ name: 'quantidade', label: 'Quantidade', type: 'number', value: 1, required: true, inputmode: 'decimal' }),
        fieldHtml({ name: 'preco_unitario', label: 'Preço unitário', type: 'number', value: 0, required: true, inputmode: 'decimal' }),
        fieldHtml({ name: 'observacao', label: 'Observação', type: 'textarea' })
      ].join(''),
      `<button type="submit" class="cds-mobile-btn">Salvar compra</button>`
    )}
    <p class="cds-muted">Usa POST /api/compras com os mesmos motores do ERP. Fluxos MIIP/XML densos permanecem no Desktop.</p>
  `;
  bindBack(root);
  root.querySelector('#cds-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = collectForm(e.target);
    const qtd = Number(d.quantidade);
    const preco = Number(d.preco_unitario);
    const total = Number(d.total) || qtd * preco;
    try {
      const created = await window.CDSApi.post('compras', {
        fornecedor: d.fornecedor,
        data_compra: d.data_compra,
        numero_nf: d.numero_nf || null,
        total,
        valor_produtos: total,
        valor_total_nota: total,
        observacao: d.observacao || null,
        itens: [{
          produto_id: Number(d.produto_id),
          quantidade: qtd,
          preco_unitario: preco,
          total: qtd * preco
        }]
      });
      showToast('Compra registrada.', 'success');
      window.CDSMobile?.navigate?.(`compras/${created.id || created?.compra_id}`, { replace: true });
    } catch (err) {
      showToast(err.message || 'Falha ao criar compra', 'error');
    }
  });
}

export async function renderDetail(root, id) {
  root.innerHTML = loadingHtml();
  try {
    const c = await window.CDSApi.get(`compras/${id}`);
    const itens = Array.isArray(c.itens) ? c.itens : [];
    const fins = Array.isArray(c.financeiro) ? c.financeiro : [];

    root.innerHTML = `
      ${backBarHtml('Compras')}
      <article class="cds-card">
        <h3 class="cds-card__title">${escapeHtml(asText(c.fornecedor, `Compra #${id}`))}</h3>
        <div class="cds-row"><span>Data</span><strong>${escapeHtml(formatDate(c.data_compra))}</strong></div>
        <div class="cds-row"><span>NF</span><strong>${escapeHtml(asText(c.numero_nf))}</strong></div>
        <div class="cds-row"><span>Total</span><strong>${escapeHtml(formatMoney(c.total ?? 0))}</strong></div>
        <div class="cds-row"><span>Status</span><strong>${escapeHtml(asText(c.status || c.situacao))}</strong></div>
        <div class="cds-row"><span>Chave</span><strong class="cds-mobile-break">${escapeHtml(asText(c.chave_acesso))}</strong></div>
      </article>
      ${sectionTitleHtml(`Itens (${itens.length})`)}
      <div>
        ${itens.length
          ? itens.map((i) => listCardHtml({
              title: asText(i.produto_nome || i.descricao || `Produto ${i.produto_id}`),
              value: formatMoney(i.total ?? 0),
              meta: [`Qtd ${i.quantidade}`]
            })).join('')
          : emptyHtml('Sem itens')}
      </div>
      ${fins.length ? `
        ${sectionTitleHtml('Financeiro gerado')}
        <div>
          ${fins.map((f) => listCardHtml({
            title: asText(f.descricao || `Parcela ${f.numero_parcela || ''}`),
            value: formatMoney(f.valor ?? 0),
            meta: [formatDate(f.vencimento), asText(f.status, '')]
          })).join('')}
        </div>
      ` : ''}
      ${actionBarHtml([
        { action: 'chave', label: 'Alterar chave NF', icon: 'edit', variant: 'secondary' },
        { action: 'cancel', label: 'Cancelar compra', icon: 'trash', variant: 'ghost' }
      ])}
    `;
    bindBack(root);
    root.querySelector('[data-action="chave"]')?.addEventListener('click', async () => {
      const data = await promptSheet({
        title: 'Chave NF-e fornecedor',
        confirmLabel: 'Salvar',
        fieldsHtml: fieldHtml({
          name: 'chave_acesso',
          label: 'Chave (44 dígitos)',
          value: c.chave_acesso || '',
          inputmode: 'numeric'
        })
      });
      if (data == null) return;
      try {
        await window.CDSApi.put(`compras/${id}/chave-nfe-fornecedor`, {
          chave_acesso: data.chave_acesso || ''
        });
        showToast('Chave atualizada.', 'success');
        window.CDSMobile?.navigate?.(`compras/${id}`, { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha ao alterar chave', 'error');
      }
    });
    root.querySelector('[data-action="cancel"]')?.addEventListener('click', async () => {
      const ok = await confirmSheet({
        title: 'Cancelar compra',
        message: 'Cancelar esta compra via Motor de Compras?',
        confirmLabel: 'Cancelar',
        danger: true
      });
      if (!ok) return;
      try {
        await window.CDSApi.post(`compras/${id}/cancelar`, {});
        showToast('Compra cancelada.', 'success');
        window.CDSMobile?.navigate?.('compras', { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha ao cancelar', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Compras')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

export async function render(root, parsed) {
  const parts = parsed?.parts || [];
  if (parts[1] === 'nova') return renderNova(root);
  if (parts[1]) return renderDetail(root, parts[1]);
  return renderList(root);
}

export default { render, title: 'Compras', subtitle: 'Operações' };
