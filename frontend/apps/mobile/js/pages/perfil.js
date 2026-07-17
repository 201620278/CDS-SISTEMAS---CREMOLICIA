/**
 * CDS Mobile RC1
 * Copyright (c) 2026 CDS Sistemas
 * Versão congelada — sem novas funcionalidades.
 */
import {
  escapeHtml,
  asText,
  currentUserName,
  errorHtml,
  icon
} from '../ui.js';
import { showToast } from '../toast.js';

function usuarioAtual() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) {
    return {};
  }
}

export async function renderPerfil(root) {
  try {
    const user = usuarioAtual();
    const nome = currentUserName();
    const login = asText(user.username || user.login, '—');
    const perfil = asText(user.perfil || user.role, '—');
    const perms = Array.isArray(user.permissoes)
      ? user.permissoes
      : String(user.permissoes || '')
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean);

    root.innerHTML = `
      <article class="cds-card cds-m-enter">
        <div style="display:flex;gap:14px;align-items:center;margin-bottom:12px">
          <div class="cds-kpi__icon" style="width:56px;height:56px;font-size:1.4rem;background:var(--color-primary-50);color:var(--color-primary-600)">
            ${icon('user')}
          </div>
          <div>
            <h3 class="cds-card__title" style="margin:0">${escapeHtml(nome)}</h3>
            <p class="cds-muted" style="margin:4px 0 0">CDS Mobile</p>
          </div>
        </div>
        <div class="cds-row"><span>Login</span><strong>${escapeHtml(login)}</strong></div>
        <div class="cds-row"><span>Perfil</span><strong>${escapeHtml(perfil)}</strong></div>
      </article>

      <h2 class="cds-section-head__title" style="margin:18px 0 10px">Permissões</h2>
      <article class="cds-card">
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${perms.length
            ? perms.slice(0, 40).map((p) => `<span class="cds-badge cds-badge--primary">${escapeHtml(asText(p))}</span>`).join('')
            : '<span class="cds-muted">Sem lista de permissões no token.</span>'}
        </div>
      </article>

      <button type="button" class="cds-mobile-btn cds-mobile-btn--ghost" id="perfil-logout">
        ${icon('logout')} Sair
      </button>
    `;

    root.querySelector('#perfil-logout')?.addEventListener('click', () => {
      window.CDSMobile?.logout?.();
    });
  } catch (err) {
    root.innerHTML = errorHtml(err.message || 'Erro ao carregar perfil.', err.status);
    showToast(err.message || 'Erro no perfil', 'error');
  }
}

export default { render: renderPerfil, title: 'Perfil', subtitle: 'Conta' };
