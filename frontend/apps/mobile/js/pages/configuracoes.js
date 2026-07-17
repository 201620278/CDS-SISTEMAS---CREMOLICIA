/**
 * CDS Mobile RC2.1 — Fluxo Configurações
 */
import { escapeHtml, errorHtml, sectionTitleHtml, asText, loadingHtml } from '../ui.js';
import { showToast } from '../toast.js';
import {
  CDS_MOBILE_VERSION_LABEL,
  CDS_MOBILE_VERSION,
  CDS_MOBILE_BUILD,
  CDS_MOBILE_STATUS
} from '../version.js';
import {
  getStoredTerminal,
  getClientMeta,
  isTerminalRegistered,
  startHeartbeat,
  disconnectTerminal
} from '../terminal.js';

const THEMES = [
  { id: 'classic', label: 'Claro' },
  { id: 'dark', label: 'Escuro' },
  { id: 'high-contrast', label: 'Alto contraste' }
];

function applyTheme(theme) {
  const next = THEMES.some((t) => t.id === theme) ? theme : 'classic';
  document.documentElement.setAttribute('data-theme', next);
  THEMES.forEach((t) => {
    document.documentElement.classList.toggle('theme-' + t.id, t.id === next);
  });
  try {
    localStorage.setItem('cds-ui-theme', next);
  } catch (e) { /* ignore */ }
  return next;
}

function readUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}') || {};
  } catch (e) {
    return {};
  }
}

function onlineLabel() {
  return navigator.onLine ? 'Online' : 'Offline';
}

async function runDiagnostico() {
  const lines = [];
  lines.push(`Conexão: ${onlineLabel()}`);
  lines.push(`API: ${window.CDSApi?.resolveApiBase?.() || '/api'}`);
  lines.push(`Terminal: ${isTerminalRegistered() ? 'registrado' : 'não registrado'}`);
  lines.push(`Service Worker: ${('serviceWorker' in navigator) ? 'suportado' : 'indisponível'}`);
  lines.push(`Câmera: ${navigator.mediaDevices?.getUserMedia ? 'disponível' : 'indisponível'}`);
  lines.push(`Share: ${navigator.share ? 'disponível' : 'fallback clipboard'}`);
  lines.push(`BarcodeDetector: ${typeof window.BarcodeDetector === 'function' ? 'disponível' : 'prompt'}`);

  try {
    const t0 = performance.now();
    await window.CDSApi.get('empresa').catch(() => window.CDSApi.get('configuracoes/empresa'));
    lines.push(`Ping API: ok (${Math.round(performance.now() - t0)} ms)`);
  } catch (err) {
    lines.push(`Ping API: falha (${err.message || err.status || 'erro'})`);
  }

  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      lines.push(`SW ativos: ${regs.length}`);
    }
  } catch (e) {
    lines.push('SW: erro ao consultar');
  }

  return lines;
}

export async function renderConfiguracoes(root) {
  root.innerHTML = loadingHtml('Carregando configurações…');
  try {
    let current = 'classic';
    try {
      current = localStorage.getItem('cds-ui-theme') || 'classic';
    } catch (e) { /* ignore */ }

    const user = readUser();
    const meta = getClientMeta();
    const term = getStoredTerminal();
    let empresa = null;
    let fiscal = null;

    try {
      empresa = await window.CDSApi.get('empresa');
    } catch (e) {
      try {
        empresa = await window.CDSApi.get('configuracoes/empresa');
      } catch (e2) { /* ignore */ }
    }
    try {
      fiscal = await window.CDSApi.get('configuracoes/fiscal');
    } catch (e) {
      try {
        fiscal = await window.CDSApi.get('fiscal/config');
      } catch (e2) { /* ignore */ }
    }

    const empresaNome = asText(
      empresa?.razao_social || empresa?.nome_fantasia || empresa?.nome || empresa?.empresa?.nome,
      '—'
    );
    const modoFiscal = asText(
      fiscal?.modo || fiscal?.ambiente || fiscal?.modo_fiscal || fiscal?.emissao || 'Consulta',
      'Consulta'
    );

    if (isTerminalRegistered()) startHeartbeat();

    root.innerHTML = `
      ${sectionTitleHtml('Empresa')}
      <article class="cds-card">
        <div class="cds-row"><span>Empresa</span><strong>${escapeHtml(empresaNome)}</strong></div>
        <div class="cds-row"><span>CNPJ</span><strong>${escapeHtml(asText(empresa?.cnpj || empresa?.documento, '—'))}</strong></div>
      </article>

      ${sectionTitleHtml('Perfil')}
      <article class="cds-card">
        <div class="cds-row"><span>Usuário</span><strong>${escapeHtml(asText(user.nome || user.username, '—'))}</strong></div>
        <div class="cds-row"><span>Perfil</span><strong>${escapeHtml(asText(user.perfil || user.role, '—'))}</strong></div>
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="cfg-perfil" style="margin-top:10px;width:100%">Abrir perfil</button>
      </article>

      ${sectionTitleHtml('Servidor')}
      <article class="cds-card">
        <div class="cds-row"><span>API</span><strong class="cds-mobile-break">${escapeHtml(asText(window.CDSApi?.resolveApiBase?.() || '/api'))}</strong></div>
        <div class="cds-row"><span>Conexão</span><strong id="cfg-conn">${escapeHtml(onlineLabel())}</strong></div>
      </article>

      ${sectionTitleHtml('Terminal')}
      <article class="cds-card">
        <div class="cds-row"><span>Status</span><strong>${term.registered ? 'Registrado' : 'Não registrado'}</strong></div>
        <div class="cds-row"><span>Nome</span><strong>${escapeHtml(asText(term.nome, '—'))}</strong></div>
        <div class="cds-row"><span>Terminal ID</span><strong>${escapeHtml(asText(term.id, '—'))}</strong></div>
        <div class="cds-row"><span>Hostname</span><strong class="cds-mobile-break">${escapeHtml(asText(term.hostname || meta.hostname, '—'))}</strong></div>
        ${term.registered ? `
          <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="cfg-term-offline" style="margin-top:10px;width:100%">Desconectar heartbeat</button>
        ` : `
          <button type="button" class="cds-mobile-btn" id="cfg-term-pdv" style="margin-top:10px;width:100%">Registrar no PDV</button>
        `}
      </article>

      ${sectionTitleHtml('Modo fiscal')}
      <article class="cds-card">
        <div class="cds-row"><span>Modo</span><strong>${escapeHtml(modoFiscal)}</strong></div>
        <p class="cds-muted" style="margin-bottom:0">Emissão/cancelamento via Motor Fiscal nas rotas oficiais (PDV / Comercial).</p>
      </article>

      ${sectionTitleHtml('Tema')}
      <article class="cds-card">
        <div class="cds-stack">
          ${THEMES.map((t) => `
            <button type="button" class="cds-mobile-btn ${t.id === current ? '' : 'cds-mobile-btn--secondary'}" data-theme="${t.id}">
              ${escapeHtml(t.label)}
            </button>
          `).join('')}
        </div>
      </article>

      ${sectionTitleHtml('Sincronização')}
      <article class="cds-card">
        <p class="cds-muted">Atualiza cache do app e força nova busca na API (sem regras locais).</p>
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="cfg-sync" style="width:100%">Sincronizar agora</button>
      </article>

      ${sectionTitleHtml('Diagnóstico')}
      <article class="cds-card">
        <pre id="cfg-diag" class="cds-diag">Toque em Executar para gerar o relatório.</pre>
        <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="cfg-diag-run" style="width:100%;margin-top:10px">Executar diagnóstico</button>
      </article>

      ${sectionTitleHtml('Cliente da plataforma')}
      <article class="cds-card">
        <div class="cds-row"><span>Client ID</span><strong>${escapeHtml(meta.client_id)}</strong></div>
        <div class="cds-row"><span>Tipo</span><strong>${escapeHtml(meta.client_type)}</strong></div>
        <div class="cds-row"><span>Plataforma</span><strong>${escapeHtml(meta.platform)}</strong></div>
        <p class="cds-muted" style="margin-top:8px">Preferência de destino após o login:</p>
        <div class="cds-stack" style="margin-top:8px">
          <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="pref-mobile">Preferir CDS Mobile</button>
          <button type="button" class="cds-mobile-btn cds-mobile-btn--secondary" id="pref-desktop">Preferir Desktop (ERP/PDV)</button>
        </div>
      </article>

      ${sectionTitleHtml('Sobre')}
      <article class="cds-card">
        <div class="cds-row"><span>App</span><strong>${escapeHtml(CDS_MOBILE_VERSION_LABEL)}</strong></div>
        <div class="cds-row"><span>Versão</span><strong>${escapeHtml(CDS_MOBILE_VERSION)}</strong></div>
        <div class="cds-row"><span>Build</span><strong>${escapeHtml(CDS_MOBILE_BUILD)}</strong></div>
        <div class="cds-row"><span>Status</span><strong>${escapeHtml(CDS_MOBILE_STATUS)}</strong></div>
      </article>

      ${sectionTitleHtml('Sessão')}
      <article class="cds-card">
        <button type="button" class="cds-mobile-btn" id="cfg-logout" style="width:100%">Logout</button>
      </article>
    `;

    root.querySelectorAll('[data-theme]').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyTheme(btn.getAttribute('data-theme'));
        showToast('Tema atualizado.', 'success');
        window.CDSMobile?.navigate?.('configuracoes', { replace: true });
      });
    });

    root.querySelector('#cfg-perfil')?.addEventListener('click', () => {
      window.CDSMobile?.navigate?.('perfil');
    });

    root.querySelector('#cfg-term-pdv')?.addEventListener('click', () => {
      window.CDSMobile?.navigate?.('pdv');
    });

    root.querySelector('#cfg-term-offline')?.addEventListener('click', async () => {
      try {
        await disconnectTerminal();
        showToast('Heartbeat desconectado.', 'info');
      } catch (err) {
        showToast(err.message || 'Falha ao desconectar.', 'error');
      }
    });

    root.querySelector('#cfg-sync')?.addEventListener('click', async () => {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.update()));
        }
        if (window.caches) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
        showToast('Sincronização concluída. Recarregando…', 'success');
        setTimeout(() => window.location.reload(), 600);
      } catch (err) {
        showToast(err.message || 'Falha na sincronização', 'error');
      }
    });

    root.querySelector('#cfg-diag-run')?.addEventListener('click', async () => {
      const pre = root.querySelector('#cfg-diag');
      if (pre) pre.textContent = 'Executando…';
      const lines = await runDiagnostico();
      if (pre) pre.textContent = lines.join('\n');
      showToast('Diagnóstico gerado.', 'success');
    });

    root.querySelector('#pref-mobile')?.addEventListener('click', () => {
      window.CDSPlatform?.forcarCliente?.('mobile');
      showToast('Preferência salva: CDS Mobile.', 'success');
    });

    root.querySelector('#pref-desktop')?.addEventListener('click', () => {
      window.CDSPlatform?.forcarCliente?.('desktop');
      showToast('Preferência salva: Desktop.', 'success');
    });

    root.querySelector('#cfg-logout')?.addEventListener('click', () => {
      document.getElementById('btn-logout')?.click();
    });

    const conn = root.querySelector('#cfg-conn');
    const syncConn = () => {
      if (conn) conn.textContent = onlineLabel();
    };
    window.addEventListener('online', syncConn);
    window.addEventListener('offline', syncConn);
  } catch (err) {
    root.innerHTML = errorHtml(err.message || 'Erro ao carregar configurações.', err.status);
    showToast(err.message || 'Erro nas configurações', 'error');
  }
}

export default { render: renderConfiguracoes, title: 'Configurações', subtitle: 'Preferências' };
