/**
 * CDS Mobile RC2.4.2 — Categorias / Subcategorias (paridade ERP Desktop)
 * Referência: frontend/erp/js/categorias.js + subcategorias.js
 */
import {
  escapeHtml,
  asText,
  loadingHtml,
  emptyHtml,
  errorHtml,
  listCardHtml,
  backBarHtml,
  bindBack,
  bindGo,
  sectionTitleHtml
} from '../ui.js';
import {
  fieldHtml,
  formCardHtml,
  collectForm,
  fabHtml,
  actionBarHtml,
  confirmDanger,
  promptSheet,
  unwrapList,
  cadastroSectionHtml,
  formSubmitActionsHtml
} from '../forms.js';
import { showToast } from '../toast.js';

function fieldsCategoria(c = {}) {
  const tipo = asText(c.tipo, 'produto');
  return `
    ${cadastroSectionHtml('Dados')}
    ${fieldHtml({ name: 'nome', label: 'Nome', value: c.nome, required: true })}
    ${fieldHtml({ name: 'descricao', label: 'Descrição', value: c.descricao, type: 'textarea' })}
    ${fieldHtml({
      name: 'tipo',
      label: 'Tipo',
      type: 'select',
      value: [
        { value: 'produto', label: 'Produto', selected: tipo === 'produto' },
        { value: 'despesa', label: 'Despesa', selected: tipo === 'despesa' }
      ]
    })}
  `;
}

/** Payload Desktop: { nome, descricao, tipo } */
export function buildCategoriaPayload(raw = {}) {
  return {
    nome: String(raw.nome || '').trim(),
    descricao: String(raw.descricao || '').trim(),
    tipo: String(raw.tipo || 'produto').trim() || 'produto'
  };
}

export async function renderList(root) {
  root.innerHTML = loadingHtml('Carregando categorias…');
  try {
    const [produtos, despesas] = await Promise.all([
      window.CDSApi.get('categorias', { tipo: 'produto' }),
      window.CDSApi.get('categorias', { tipo: 'despesa' })
    ]);
    const p = Array.isArray(produtos) ? produtos : [];
    const d = Array.isArray(despesas) ? despesas : [];

    root.innerHTML = `
      ${sectionTitleHtml(`Produtos (${p.length})`)}
      <div>
        ${p.length
          ? p.map((c) => listCardHtml({
              go: `categorias/${c.id}`,
              title: asText(c.nome),
              subtitle: asText(c.descricao, 'Produto')
            })).join('')
          : emptyHtml('Nenhuma categoria de produto')}
      </div>
      ${sectionTitleHtml(`Despesas (${d.length})`)}
      <div>
        ${d.length
          ? d.map((c) => listCardHtml({
              go: `categorias/${c.id}`,
              title: asText(c.nome),
              subtitle: asText(c.descricao, 'Despesa')
            })).join('')
          : emptyHtml('Nenhuma categoria de despesa')}
      </div>
      ${fabHtml('Nova categoria', 'categorias/novo')}
    `;
    bindGo(root);
  } catch (err) {
    root.innerHTML = errorHtml(err.message, err.status);
  }
}

export async function renderForm(root, id) {
  const isNew = !id;
  root.innerHTML = loadingHtml();
  try {
    let c = {};
    if (!isNew) c = await window.CDSApi.get(`categorias/${id}`);
    root.innerHTML = `
      ${backBarHtml('Categorias')}
      ${formCardHtml(
        isNew ? 'Nova categoria' : 'Editar categoria',
        fieldsCategoria(c),
        formSubmitActionsHtml(isNew ? 'Salvar' : 'Atualizar')
      )}
    `;
    bindBack(root);
    root.querySelector('#cds-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = buildCategoriaPayload(collectForm(e.target));
      if (!body.nome) {
        showToast('Nome obrigatório.', 'warning');
        return;
      }
      try {
        if (isNew) {
          const created = await window.CDSApi.post('categorias', body);
          showToast('Categoria criada.', 'success');
          window.CDSMobile?.navigate?.(`categorias/${created.id || created?.data?.id}`, { replace: true });
        } else {
          await window.CDSApi.put(`categorias/${id}`, body);
          showToast('Categoria atualizada.', 'success');
          window.CDSMobile?.navigate?.(`categorias/${id}`, { replace: true });
        }
      } catch (err) {
        showToast(err.message || 'Falha ao salvar', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Categorias')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

export async function renderDetail(root, id) {
  root.innerHTML = loadingHtml();
  try {
    const c = await window.CDSApi.get(`categorias/${id}`);
    const isProduto = asText(c.tipo, 'produto') === 'produto';
    let subs = [];
    if (isProduto) {
      try {
        subs = unwrapList(await window.CDSApi.get(`subcategorias/categoria/${id}`));
      } catch (e) {
        try {
          subs = unwrapList(await window.CDSApi.get('subcategorias', { categoria_id: id }));
        } catch (e2) {
          subs = [];
        }
      }
    }

    let produtoCats = [];
    if (isProduto) {
      try {
        const all = await window.CDSApi.get('categorias', { tipo: 'produto' });
        produtoCats = Array.isArray(all) ? all : [];
      } catch (e) {
        produtoCats = [];
      }
    }

    const paint = async () => {
      if (isProduto) {
        try {
          subs = unwrapList(await window.CDSApi.get(`subcategorias/categoria/${id}`));
        } catch (e) {
          subs = [];
        }
      }

      root.innerHTML = `
        ${backBarHtml('Categorias')}
        <article class="cds-card">
          <h3 class="cds-card__title">${escapeHtml(asText(c.nome))}</h3>
          <div class="cds-row"><span>Tipo</span><strong>${escapeHtml(asText(c.tipo))}</strong></div>
          <div class="cds-row"><span>Descrição</span><strong>${escapeHtml(asText(c.descricao))}</strong></div>
        </article>
        ${isProduto ? `
          ${sectionTitleHtml(`Subcategorias (${subs.length})`)}
          <div id="subs-list">
            ${subs.length
              ? subs.map((s) => `
                  <article class="cds-list-card cds-list-card--static cds-m-enter">
                    <div class="cds-list-card__main">
                      <strong class="cds-list-card__title">${escapeHtml(asText(s.nome))}</strong>
                    </div>
                    <div class="cds-stack" style="flex-direction:row;gap:6px;width:100%;margin-top:8px">
                      <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" data-sub-edit="${escapeHtml(String(s.id))}">Editar</button>
                      <button type="button" class="cds-mobile-btn cds-mobile-btn--ghost" data-sub-del="${escapeHtml(String(s.id))}">Excluir</button>
                    </div>
                  </article>
                `).join('')
              : emptyHtml('Sem subcategorias')}
          </div>
          <div class="cds-stack" style="margin-top:12px">
            <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="sub-add">Nova subcategoria</button>
          </div>
        ` : `
          <p class="cds-muted cds-form-hint">Categorias de despesa não possuem subcategorias (paridade ERP Desktop).</p>
        `}
        ${actionBarHtml([
          { action: 'edit', label: 'Editar', icon: 'edit', variant: 'secondary' },
          { action: 'delete', label: 'Excluir', icon: 'trash', variant: 'ghost' }
        ])}
      `;
      bindBack(root);

      root.querySelector('#sub-add')?.addEventListener('click', async () => {
        const data = await promptSheet({
          title: 'Nova subcategoria',
          confirmLabel: 'Criar',
          fieldsHtml: fieldHtml({ name: 'nome', label: 'Nome', required: true })
        });
        const nome = data?.nome;
        if (!nome) return;
        try {
          await window.CDSApi.post('subcategorias', { nome: String(nome).trim(), categoria_id: Number(id) });
          showToast('Subcategoria criada.', 'success');
          await paint();
        } catch (err) {
          showToast(err.message || 'Falha ao criar subcategoria', 'error');
        }
      });

      root.querySelectorAll('[data-sub-edit]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const subId = btn.getAttribute('data-sub-edit');
          const sub = subs.find((s) => String(s.id) === String(subId));
          if (!sub) return;
          const catOptions = (produtoCats.length ? produtoCats : [{ id, nome: c.nome }]).map((cat) => `
            <option value="${escapeHtml(String(cat.id))}" ${String(cat.id) === String(sub.categoria_id || id) ? 'selected' : ''}>
              ${escapeHtml(asText(cat.nome))}
            </option>
          `).join('');
          const data = await promptSheet({
            title: 'Editar subcategoria',
            confirmLabel: 'Salvar',
            fieldsHtml: `
              ${fieldHtml({ name: 'nome', label: 'Nome', value: sub.nome, required: true })}
              <label class="cds-field" for="f-categoria_id">
                <span class="cds-field__label">Categoria</span>
                <select class="cds-field__input" id="f-categoria_id" name="categoria_id">${catOptions}</select>
              </label>
            `
          });
          if (!data?.nome) return;
          try {
            await window.CDSApi.put(`subcategorias/${subId}`, {
              nome: String(data.nome).trim(),
              categoria_id: Number(data.categoria_id || id)
            });
            showToast('Subcategoria atualizada.', 'success');
            if (String(data.categoria_id) !== String(id)) {
              window.CDSMobile?.navigate?.(`categorias/${data.categoria_id}`, { replace: true });
              return;
            }
            await paint();
          } catch (err) {
            showToast(err.message || 'Falha ao editar subcategoria', 'error');
          }
        });
      });

      root.querySelectorAll('[data-sub-del]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const subId = btn.getAttribute('data-sub-del');
          const sub = subs.find((s) => String(s.id) === String(subId));
          const ok = await confirmDanger(`Excluir subcategoria "${sub?.nome || subId}"?`, {
            title: 'Excluir subcategoria',
            confirmLabel: 'Excluir'
          });
          if (!ok) return;
          try {
            await window.CDSApi.del(`subcategorias/${subId}`);
            showToast('Subcategoria excluída.', 'success');
            await paint();
          } catch (err) {
            showToast(err.message || 'Não foi possível excluir', 'error');
          }
        });
      });

      root.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
        window.CDSMobile?.navigate?.(`categorias/${id}/editar`);
      });
      root.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
        const ok = await confirmDanger(`Excluir categoria "${c.nome}"?`, { title: 'Excluir categoria', confirmLabel: 'Excluir' });
        if (!ok) return;
        try {
          await window.CDSApi.del(`categorias/${id}`);
          showToast('Categoria excluída.', 'success');
          window.CDSMobile?.navigate?.('categorias', { replace: true });
        } catch (err) {
          showToast(err.message || 'Não foi possível excluir', 'error');
        }
      });
    };

    await paint();
  } catch (err) {
    root.innerHTML = `${backBarHtml('Categorias')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

export async function render(root, parsed) {
  const parts = parsed?.parts || [];
  if (parts[1] === 'novo') return renderForm(root, null);
  if (parts[1] && parts[2] === 'editar') return renderForm(root, parts[1]);
  if (parts[1]) return renderDetail(root, parts[1]);
  return renderList(root);
}

export default {
  render,
  buildCategoriaPayload,
  title: 'Categorias',
  subtitle: 'Cadastros'
};
