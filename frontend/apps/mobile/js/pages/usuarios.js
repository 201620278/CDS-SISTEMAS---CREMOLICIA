/**
 * CDS Mobile RC2.4.2 — Cadastro de Usuários (paridade ERP Desktop)
 * Referência: frontend/erp/js/usuarios.js → salvarNovoUsuario
 */
import {
  escapeHtml,
  asText,
  formatDate,
  loadingHtml,
  emptyHtml,
  errorHtml,
  listCardHtml,
  backBarHtml,
  bindBack,
  bindGo,
  countLabel,
  statusBadgeHtml,
  sectionTitleHtml
} from '../ui.js';
import {
  fieldHtml,
  formCardHtml,
  collectForm,
  fabHtml,
  actionBarHtml,
  confirmDanger,
  showTextSheet,
  unwrapList,
  cadastroSectionHtml,
  formSubmitActionsHtml,
  currentUserId
} from '../forms.js';
import { showToast } from '../toast.js';

const PERM_FALLBACK = [
  'pdv', 'vendas', 'produtos', 'clientes', 'compras', 'fornecedores',
  'financeiro', 'caixa', 'abrir_caixa', 'sangria_caixa', 'suprimento_caixa',
  'fiscal', 'configuracoes', 'usuarios', 'relatorios', 'auditoria', 'categorias',
  'gerenciar_faixa_atacado',
  'COMERCIAL_VISUALIZAR', 'COMERCIAL_CONSIGNACAO', 'COMERCIAL_ACERTO',
  'COMERCIAL_LIMITE', 'COMERCIAL_PERDAS', 'COMERCIAL_CORTESIAS', 'COMERCIAL_DASHBOARD'
];

const PERM_LABELS = {
  pdv: 'PDV',
  vendas: 'Vendas',
  produtos: 'Produtos',
  clientes: 'Clientes',
  compras: 'Compras',
  fornecedores: 'Fornecedores',
  financeiro: 'Financeiro',
  caixa: 'Caixa',
  abrir_caixa: 'Abrir caixa',
  sangria_caixa: 'Sangria',
  suprimento_caixa: 'Suprimento',
  fiscal: 'Fiscal',
  configuracoes: 'Configurações',
  usuarios: 'Usuários',
  relatorios: 'Relatórios',
  auditoria: 'Auditoria',
  categorias: 'Categorias',
  gerenciar_faixa_atacado: 'Faixa atacado',
  COMERCIAL_VISUALIZAR: 'Comercial — visualizar',
  COMERCIAL_CONSIGNACAO: 'Comercial — consignação',
  COMERCIAL_ACERTO: 'Comercial — acerto',
  COMERCIAL_LIMITE: 'Comercial — limite',
  COMERCIAL_PERDAS: 'Comercial — perdas',
  COMERCIAL_CORTESIAS: 'Comercial — cortesias',
  COMERCIAL_DASHBOARD: 'Comercial — dashboard'
};

function currentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    return {};
  }
}

function isSuperAdmin() {
  return asText(currentUser().perfil) === 'SUPER_ADMIN';
}

async function loadPermOptions() {
  try {
    const list = await window.CDSApi.get('auth/permissoes-disponiveis');
    if (Array.isArray(list) && list.length) return list;
  } catch (e) { /* fallback */ }
  return PERM_FALLBACK;
}

async function findUsuarioById(id) {
  const [ativos, inativos] = await Promise.allSettled([
    window.CDSApi.get('auth/usuarios'),
    window.CDSApi.get('auth/usuarios', { status: 'inativos' })
  ]);
  const rows = [
    ...unwrapList(ativos.status === 'fulfilled' ? ativos.value : []),
    ...unwrapList(inativos.status === 'fulfilled' ? inativos.value : [])
  ];
  return rows.find((x) => String(x.id) === String(id)) || null;
}

function fieldsUsuario(u = {}, { isNew = false, permOptions = PERM_FALLBACK } = {}) {
  const perfil = asText(u.perfil, 'USUARIO');
  const role = asText(u.role, 'operador');
  const perms = Array.isArray(u.permissoes) ? u.permissoes : [];
  const podeSenhas = Number(u.pode_alterar_senhas || 0) === 1;

  return `
    ${cadastroSectionHtml('Acesso')}
    ${fieldHtml({ name: 'username', label: 'Nome de usuário', value: u.username, required: true, autocomplete: 'username' })}
    ${fieldHtml({
      name: 'password',
      label: isNew ? 'Senha' : 'Nova senha (opcional)',
      type: 'password',
      required: isNew,
      autocomplete: 'new-password'
    })}
    ${fieldHtml({
      name: 'role',
      label: 'Tipo de acesso',
      type: 'select',
      value: [
        { value: 'operador', label: 'Operador', selected: role !== 'admin' },
        { value: 'admin', label: 'Admin', selected: role === 'admin' }
      ]
    })}
    ${fieldHtml({
      name: 'perfil',
      label: 'Perfil de permissão',
      type: 'select',
      value: ['USUARIO', 'ADMIN', 'SUPER_ADMIN'].map((p) => ({
        value: p,
        label: p,
        selected: perfil === p
      }))
    })}
    ${fieldHtml({
      name: 'pode_alterar_senhas',
      label: 'Pode alterar senhas',
      type: 'checkbox',
      value: podeSenhas
    })}
    <div id="area-permissoes" class="cds-card" style="margin:12px 0;padding:12px">
      <h3 class="cds-card__title" style="font-size:0.95rem">Permissões do operador</h3>
      <div class="cds-perm-grid">
        ${permOptions.map((p) => `
          <label class="cds-field cds-field--check">
            <input type="checkbox" name="perm_${escapeHtml(p)}" ${perms.includes(p) ? 'checked' : ''}>
            <span>${escapeHtml(PERM_LABELS[p] || p)}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

/** Payload alinhado ao Desktop salvarNovoUsuario. */
export function buildUsuarioPayload(form) {
  const base = collectForm(form);
  const permissoes = [];
  form.querySelectorAll('input[type="checkbox"][name^="perm_"]').forEach((el) => {
    if (el.checked) permissoes.push(el.name.replace(/^perm_/, ''));
  });
  const body = {
    username: String(base.username || '').trim(),
    role: base.role || 'operador',
    perfil: base.perfil || 'USUARIO',
    pode_alterar_senhas: base.pode_alterar_senhas ? 1 : 0,
    permissoes
  };
  if (base.password) body.password = base.password;
  else if (!form.querySelector('[name="password"]')?.value) {
    /* edit sem senha: Desktop envia ""; Mobile omite (API trata ambos) */
  }
  return body;
}

function syncPermissoesVisibilidade(root) {
  const role = root.querySelector('[name="role"]')?.value;
  const area = root.querySelector('#area-permissoes');
  if (area) area.classList.toggle('is-hidden', role === 'admin');
}

export async function renderList(root) {
  root.innerHTML = loadingHtml('Carregando usuários…');
  try {
    const [ativosRes, inativosRes] = await Promise.allSettled([
      window.CDSApi.get('auth/usuarios'),
      window.CDSApi.get('auth/usuarios', { status: 'inativos' })
    ]);
    const ativos = unwrapList(ativosRes.status === 'fulfilled' ? ativosRes.value : []);
    const inativos = unwrapList(inativosRes.status === 'fulfilled' ? inativosRes.value : []);

    root.innerHTML = `
      ${sectionTitleHtml(`Ativos (${ativos.length})`)}
      <div>
        ${ativos.length
          ? ativos.map((u) => listCardHtml({
              go: `usuarios/${u.id}`,
              title: asText(u.username || u.nome, 'Usuário'),
              subtitle: asText(u.perfil || u.role),
              status: 'Ativo',
              meta: [asText(Array.isArray(u.permissoes) ? `${u.permissoes.length} perms` : '')].filter(Boolean)
            })).join('')
          : emptyHtml('Nenhum usuário ativo')}
      </div>
      ${sectionTitleHtml(`Desativados (${inativos.length})`)}
      <div>
        ${inativos.length
          ? inativos.map((u) => listCardHtml({
              go: `usuarios/${u.id}`,
              title: asText(u.username || u.nome, 'Usuário'),
              subtitle: asText(u.perfil || u.role),
              status: 'Inativo',
              meta: [asText(Array.isArray(u.permissoes) ? `${u.permissoes.length} perms` : '')].filter(Boolean)
            })).join('')
          : emptyHtml('Nenhum usuário desativado')}
      </div>
      <p class="cds-muted" style="margin-top:8px">${escapeHtml(countLabel(ativos.length + inativos.length, 'usuário', 'usuários'))}</p>
      ${fabHtml('Novo usuário', 'usuarios/novo')}
    `;
    bindGo(root);
  } catch (err) {
    root.innerHTML = errorHtml(err.message || 'Erro ao listar usuários.', err.status);
    showToast(err.message || 'Erro em usuários', 'error');
  }
}

export async function renderForm(root, id) {
  const isNew = !id;
  root.innerHTML = loadingHtml();
  try {
    let u = {};
    if (!isNew) {
      u = await findUsuarioById(id);
      if (!u?.id) {
        root.innerHTML = `${backBarHtml('Usuários')}${errorHtml('Usuário não encontrado.', 404)}`;
        bindBack(root);
        return;
      }
    }

    const permOptions = await loadPermOptions();

    root.innerHTML = `
      ${backBarHtml('Usuários')}
      ${formCardHtml(
        isNew ? 'Novo usuário' : `Editar ${asText(u.username)}`,
        fieldsUsuario(u, { isNew, permOptions }),
        formSubmitActionsHtml(isNew ? 'Criar' : 'Salvar')
      )}
    `;
    bindBack(root);
    syncPermissoesVisibilidade(root);
    root.querySelector('[name="role"]')?.addEventListener('change', () => syncPermissoesVisibilidade(root));

    if (!isNew) {
      const userField = root.querySelector('#f-username');
      if (userField) {
        userField.readOnly = true;
        userField.style.opacity = '0.7';
      }
    }

    root.querySelector('#cds-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const body = buildUsuarioPayload(e.target);
      if (!body.username) {
        showToast('Login é obrigatório.', 'warning');
        return;
      }
      if (isNew && !body.password) {
        showToast('Senha é obrigatória.', 'warning');
        return;
      }
      try {
        if (isNew) {
          const created = await window.CDSApi.post('auth/usuarios', body);
          showToast('Usuário criado.', 'success');
          window.CDSMobile?.navigate?.(`usuarios/${created.id}`, { replace: true });
        } else {
          await window.CDSApi.put(`auth/usuarios/${id}`, body);
          showToast('Usuário atualizado.', 'success');
          window.CDSMobile?.navigate?.(`usuarios/${id}`, { replace: true });
        }
      } catch (err) {
        showToast(err.message || 'Falha ao salvar usuário', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Usuários')}${errorHtml(err.message, err.status)}`;
    bindBack(root);
  }
}

export async function renderDetail(root, id) {
  root.innerHTML = loadingHtml();
  try {
    const u = await findUsuarioById(id);
    if (!u) {
      root.innerHTML = `${backBarHtml('Usuários')}${errorHtml('Usuário não encontrado.', 404)}`;
      bindBack(root);
      return;
    }
    const perms = Array.isArray(u.permissoes) ? u.permissoes : [];
    const selfId = currentUserId();
    const isSelf = selfId != null && String(selfId) === String(u.id);
    const canLifecycle = isSuperAdmin() && !isSelf;

    const actions = [
      { action: 'edit', label: 'Editar', icon: 'edit', variant: 'secondary' }
    ];
    if (canLifecycle) {
      actions.push(
        Number(u.ativo) === 0
          ? { action: 'ativar', label: 'Reativar', icon: 'check', variant: 'secondary' }
          : { action: 'desativar', label: 'Desativar', icon: 'trash', variant: 'ghost' }
      );
      actions.push({ action: 'delete', label: 'Excluir', icon: 'trash', variant: 'ghost' });
    }
    actions.push({ action: 'relatorio', label: 'Relatório', icon: 'receipt', variant: 'ghost' });

    root.innerHTML = `
      ${backBarHtml('Usuários')}
      <article class="cds-card cds-m-enter">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:8px">
          <h3 class="cds-card__title" style="margin:0">${escapeHtml(asText(u.username))}</h3>
          ${statusBadgeHtml(u.ativo === 0 ? 'Cancelada' : 'Ativa')}
        </div>
        <div class="cds-row"><span>Perfil</span><strong>${escapeHtml(asText(u.perfil))}</strong></div>
        <div class="cds-row"><span>Role</span><strong>${escapeHtml(asText(u.role))}</strong></div>
        <div class="cds-row"><span>Pode alterar senhas</span><strong>${Number(u.pode_alterar_senhas || 0) === 1 ? 'Sim' : 'Não'}</strong></div>
        <div class="cds-row"><span>Criado</span><strong>${escapeHtml(formatDate(u.created_at))}</strong></div>
      </article>
      <article class="cds-card">
        <h3 class="cds-card__title">Permissões</h3>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${perms.length
            ? perms.map((p) => `<span class="cds-badge cds-badge--primary">${escapeHtml(PERM_LABELS[p] || asText(p))}</span>`).join('')
            : '<span class="cds-muted">Nenhuma (ou admin implícito)</span>'}
        </div>
      </article>
      ${actionBarHtml(actions)}
    `;
    bindBack(root);
    root.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
      window.CDSMobile?.navigate?.(`usuarios/${id}/editar`);
    });
    root.querySelector('[data-action="desativar"]')?.addEventListener('click', async () => {
      const ok = await confirmDanger(`Desativar usuário "${u.username}"?`, { title: 'Desativar usuário', confirmLabel: 'Desativar' });
      if (!ok) return;
      try {
        await window.CDSApi.patch(`auth/usuarios/${id}/desativar`, {});
        showToast('Usuário desativado.', 'success');
        window.CDSMobile?.navigate?.(`usuarios/${id}`, { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha ao desativar', 'error');
      }
    });
    root.querySelector('[data-action="ativar"]')?.addEventListener('click', async () => {
      try {
        await window.CDSApi.patch(`auth/usuarios/${id}/ativar`, {});
        showToast('Usuário reativado.', 'success');
        window.CDSMobile?.navigate?.(`usuarios/${id}`, { replace: true });
      } catch (err) {
        showToast(err.message || 'Falha ao reativar', 'error');
      }
    });
    root.querySelector('[data-action="relatorio"]')?.addEventListener('click', async () => {
      try {
        const rel = await window.CDSApi.get(`auth/usuarios/${id}/relatorio`);
        const txt = typeof rel === 'string' ? rel : JSON.stringify(rel, null, 2);
        showTextSheet({ title: 'Relatório do usuário', text: txt.slice(0, 3500) });
      } catch (err) {
        showToast(err.message || 'Relatório indisponível', 'error');
      }
    });
    root.querySelector('[data-action="delete"]')?.addEventListener('click', async () => {
      const ok = await confirmDanger(`Excluir usuário "${u.username}"? (requer SUPER_ADMIN)`, {
        title: 'Excluir usuário',
        confirmLabel: 'Excluir'
      });
      if (!ok) return;
      try {
        await window.CDSApi.del(`auth/usuarios/${id}`);
        showToast('Usuário excluído.', 'success');
        window.CDSMobile?.navigate?.('usuarios', { replace: true });
      } catch (err) {
        showToast(err.message || 'Não foi possível excluir', 'error');
      }
    });
  } catch (err) {
    root.innerHTML = `${backBarHtml('Usuários')}${errorHtml(err.message, err.status)}`;
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
  renderDetail,
  buildUsuarioPayload,
  title: 'Usuários',
  subtitle: 'Cadastros'
};
