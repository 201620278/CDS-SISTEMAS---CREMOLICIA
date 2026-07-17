/**
 * CDS Mobile RC2.2 — Caixas e Terminais (APIs /api/caixas, /api/terminais)
 */
import {
  escapeHtml,
  asText,
  loadingHtml,
  emptyHtml,
  errorHtml,
  listCardHtml,
  sectionTitleHtml,
  backBarHtml,
  bindBack,
  bindGo
} from '../ui.js';
import { fieldHtml, formCardHtml, collectForm, fabHtml, actionBarHtml, confirmSheet, unwrapList } from '../forms.js';
import { showToast } from '../toast.js';
import { isAdmin } from '../permissions.js';

export async function renderList(root) {
  root.innerHTML = loadingHtml('Carregando caixas…');
  try {
    const [caixasRaw, terminaisRaw] = await Promise.allSettled([
      window.CDSApi.get('caixas'),
      window.CDSApi.get('terminais')
    ]);
    const caixas = caixasRaw.status === 'fulfilled' ? unwrapList(caixasRaw.value) : [];
    const terminais = terminaisRaw.status === 'fulfilled' ? unwrapList(terminaisRaw.value) : [];

    root.innerHTML = `
      ${sectionTitleHtml(`Caixas (${caixas.length})`)}
      <div>
        ${caixas.length
          ? caixas.map((c) => listCardHtml({
              go: `caixas/${c.id}`,
              title: asText(c.nome, `Caixa #${c.id}`),
              subtitle: asText(c.descricao),
              status: Number(c.ativo) === 0 ? 'Inativo' : 'Ativo'
            })).join('')
          : emptyHtml('Nenhum caixa cadastrado')}
      </div>
      ${isAdmin() ? fabHtml('Novo caixa', 'caixas/novo') : ''}

      ${sectionTitleHtml(`Terminais (${terminais.length})`)}
      <div>
        ${terminais.length
          ? terminais.map((t) => listCardHtml({
              title: asText(t.nome || t.hostname || `Terminal #${t.id}`),
              subtitle: asText(t.hostname || t.plataforma),
              status: t.online || t.status === 'online' ? 'Online' : asText(t.status || t.ativo),
              meta: [
                asText(t.cliente_tipo || t.origem, ''),
                t.caixa_id ? `Caixa ${t.caixa_id}` : ''
              ].filter(Boolean)
            })).join('')
          : emptyHtml('Nenhum terminal')}
      </div>
      <p class="cds-muted">Gestão completa de vínculos avançados permanece alinhada às mesmas APIs do ERP.</p>
    `;
    bindGo(root);
  } catch (err) {
    root.innerHTML = errorHtml(err.message, err.status);
  }
}

export async function renderForm(root) {
  root.innerHTML = `
    ${backBarHtml('Caixas')}
    ${formCardHtml(
      'Novo caixa',
      [
        fieldHtml({ name: 'nome', label: 'Nome', required: true }),
        fieldHtml({ name: 'descricao', label: 'Descrição', type: 'textarea' })
      ].join(''),
      `<button type="submit" class="cds-mobile-btn">Criar</button>`
    )}
  `;
  bindBack(root);
  root.querySelector('#cds-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = collectForm(e.target);
    try {
      const created = await window.CDSApi.post('caixas', { ...body, ativo: 1 });
      showToast('Caixa criado.', 'success');
      window.CDSMobile?.navigate?.(`caixas/${created.id}`, { replace: true });
    } catch (err) {
      showToast(err.message || 'Falha ao criar caixa', 'error');
    }
  });
}

export async function renderDetail(root, id) {
  root.innerHTML = loadingHtml();
  try {
    const c = await window.CDSApi.get(`caixas/${id}`);
    const ativo = Number(c.ativo) !== 0;
    root.innerHTML = `
      ${backBarHtml('Caixas')}
      <article class="cds-card">
        <h3 class="cds-card__title">${escapeHtml(asText(c.nome))}</h3>
        <div class="cds-row"><span>Descrição</span><strong>${escapeHtml(asText(c.descricao))}</strong></div>
        <div class="cds-row"><span>Status</span><strong>${ativo ? 'Ativo' : 'Inativo'}</strong></div>
      </article>
      ${actionBarHtml([
        ativo
          ? { action: 'desativar', label: 'Desativar', icon: 'trash', variant: 'ghost' }
          : { action: 'reativar', label: 'Reativar', icon: 'check', variant: 'secondary' }
      ])}
    `;
    bindBack(root);
    root.querySelector('[data-action="desativar"]')?.addEventListener('click', async () => {
      const ok = await confirmSheet({ title: 'Desativar', message: `Desativar caixa "${c.nome}"?`, danger: true });
      if (!ok) return;
      try {
        await window.CDSApi.del(`caixas/${id}`);
        showToast('Caixa desativado.', 'success');
        window.CDSMobile?.navigate?.('caixas', { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha', 'error');
      }
    });
    root.querySelector('[data-action="reativar"]')?.addEventListener('click', async () => {
      try {
        await window.CDSApi.put(`caixas/${id}/reativar`, {});
        showToast('Caixa reativado.', 'success');
        window.CDSMobile?.navigate?.(`caixas/${id}`, { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Caixas')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

export async function render(root, parsed) {
  const parts = parsed?.parts || [];
  if (parts[1] === 'novo') return renderForm(root);
  if (parts[1]) return renderDetail(root, parts[1]);
  return renderList(root);
}

export default { render, title: 'Caixas', subtitle: 'MultiCaixa' };
