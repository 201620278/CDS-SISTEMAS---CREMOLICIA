/**
 * CDS Mobile RC2.2 — Auditoria (GET /api/auditoria/list)
 */
import {
  escapeHtml,
  asText,
  formatDateTime,
  loadingHtml,
  emptyHtml,
  errorHtml,
  listCardHtml,
  searchBarHtml,
  countLabel,
  debounce
} from '../ui.js';
import { unwrapList } from '../forms.js';
import { showToast } from '../toast.js';

export async function renderAuditoria(root) {
  root.innerHTML = `
    ${searchBarHtml('Filtrar módulo, ação ou usuário', 'aud-search')}
    <p class="cds-muted" id="aud-count">Carregando…</p>
    <div id="aud-list">${loadingHtml()}</div>
  `;
  const list = root.querySelector('#aud-list');
  const count = root.querySelector('#aud-count');
  let all = [];

  try {
    let raw;
    try {
      raw = await window.CDSApi.get('auditoria/list', { limite: 100 });
    } catch (e) {
      raw = await window.CDSApi.get('auditoria', { limite: 100 });
    }
    all = unwrapList(raw?.items || raw?.data || raw);

    const paint = (rows) => {
      count.textContent = countLabel(rows.length, 'evento', 'eventos');
      list.innerHTML = rows.length
        ? rows.slice(0, 80).map((a) => listCardHtml({
            title: asText(a.acao || a.action || a.evento, 'Evento'),
            subtitle: asText(a.modulo || a.module || a.entidade),
            meta: [
              asText(a.usuario_nome || a.username || a.usuario_id, ''),
              formatDateTime(a.criado_em || a.created_at || a.data)
            ].filter((x) => x && x !== '—')
          })).join('')
        : emptyHtml('Sem eventos de auditoria');
    };

    paint(all);
    root.querySelector('#aud-search')?.addEventListener('input', debounce((e) => {
      const q = String(e.target.value || '').toLowerCase().trim();
      paint(!q ? all : all.filter((a) => JSON.stringify(a).toLowerCase().includes(q)));
    }, 200));
  } catch (err) {
    list.innerHTML = errorHtml(err.message, err.status);
    showToast(err.message || 'Erro na auditoria', 'error');
  }
}

export default { render: renderAuditoria, title: 'Auditoria', subtitle: 'Sistema' };
