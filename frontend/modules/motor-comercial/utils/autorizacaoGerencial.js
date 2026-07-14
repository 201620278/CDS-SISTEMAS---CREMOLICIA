/**
 * Autorização Gerencial — modal e fluxo de liberação (STAB-01.3)
 *
 * Padrão oficial CDS para operações sensíveis.
 * Autenticação via POST /api/auth/supervisor/authorize (mecanismo oficial).
 *
 * @module frontend/modules/motor-comercial/utils/autorizacaoGerencial
 */

const Modal = require('../components/navigation/Modal');
const Button = require('../components/base/Button');
const Input = require('../components/form/Input');
const { notify } = require('./operacional');

const SESSION_PREFIX = 'cds-mc-liberacao-limite:';

function getApiUrl() {
  if (typeof window !== 'undefined' && typeof window.API_URL === 'string') {
    return window.API_URL;
  }
  return `${window.location.origin}/api`;
}

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

function buildField(labelText, inputEl, required = false) {
  const wrap = document.createElement('div');
  wrap.className = 'cds-autorizacao-gerencial__field';
  const label = document.createElement('label');
  label.className = 'cds-autorizacao-gerencial__label';
  label.textContent = required ? `${labelText} *` : labelText;
  wrap.appendChild(label);
  wrap.appendChild(inputEl);
  return wrap;
}

/**
 * Modal padrão de Autorização Gerencial.
 * @param {Object} options
 * @param {string} [options.title]
 * @param {string} [options.subtitle]
 * @param {number} [options.valorEntrega]
 * @param {number} [options.creditoDisponivel]
 * @param {number} [options.valorExcedido]
 * @returns {Promise<{username:string,password:string,motivo:string}|null>}
 */
function autorizacaoGerencialDialog(options = {}) {
  return new Promise((resolve) => {
    const content = document.createElement('div');
    content.className = 'cds-autorizacao-gerencial';

    if (options.subtitle) {
      const hint = document.createElement('p');
      hint.className = 'cds-autorizacao-gerencial__hint';
      hint.textContent = options.subtitle;
      content.appendChild(hint);
    }

    if (options.valorExcedido != null) {
      const resumo = document.createElement('div');
      resumo.className = 'cds-autorizacao-gerencial__resumo';
      resumo.innerHTML = `
        <div><span>Valor da entrega</span><strong>${formatMoney(options.valorEntrega)}</strong></div>
        <div><span>Crédito disponível</span><strong>${formatMoney(options.creditoDisponivel)}</strong></div>
        <div><span>Valor excedido</span><strong>${formatMoney(options.valorExcedido)}</strong></div>
      `;
      content.appendChild(resumo);
    }

    const userGroup = Input.create({
      type: 'text',
      name: 'usuarioAdmin',
      placeholder: 'Usuário administrador',
      autocomplete: 'username'
    });
    const passGroup = Input.create({
      type: 'password',
      name: 'senhaAdmin',
      placeholder: 'Senha',
      autocomplete: 'current-password'
    });
    const motivoGroup = Input.create({
      type: 'text',
      name: 'motivo',
      placeholder: 'Motivo da liberação (recomendado)'
    });

    const userInput = userGroup.querySelector('input');
    const passInput = passGroup.querySelector('input');
    const motivoInput = motivoGroup.querySelector('input');
    if (userInput) userInput.autocomplete = 'username';
    if (passInput) passInput.autocomplete = 'current-password';

    content.appendChild(buildField('Usuário Administrador', userGroup, true));
    content.appendChild(buildField('Senha', passGroup, true));
    content.appendChild(buildField('Motivo', motivoGroup, false));

    const errorEl = document.createElement('p');
    errorEl.className = 'cds-autorizacao-gerencial__error';
    errorEl.hidden = true;
    content.appendChild(errorEl);

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.gap = '8px';
    footer.style.justifyContent = 'flex-end';

    let backdrop;

    const finish = (value) => {
      closeModal(backdrop);
      resolve(value);
    };

    footer.appendChild(Button.create({
      text: 'Cancelar',
      variant: 'secondary',
      onClick: () => finish(null)
    }));

    footer.appendChild(Button.create({
      text: 'Autorizar',
      variant: 'primary',
      onClick: () => {
        const username = (userInput.value || '').trim();
        const password = passInput.value || '';
        const motivo = (motivoInput.value || '').trim();
        if (!username || !password) {
          errorEl.textContent = 'Usuário e senha são obrigatórios.';
          errorEl.hidden = false;
          return;
        }
        finish({ username, password, motivo });
      }
    }));

    backdrop = Modal.create({
      title: options.title || 'Autorização Gerencial',
      content,
      footer,
      open: true,
      onClose: () => finish(null)
    });

    openModal(backdrop);
    setTimeout(() => userInput?.focus(), 50);
  });
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Autentica administrador via mecanismo oficial CDS.
 * @param {{username:string,password:string}} credentials
 */
async function autenticarAdministrador(credentials) {
  const response = await fetch(`${getApiUrl()}/auth/supervisor/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: credentials.username,
      password: credentials.password
    })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Falha na autenticação do administrador');
  }
  return data;
}

/**
 * Fluxo completo: modal → autenticação → registro de auditoria.
 * @param {Object} contexto
 * @param {Function} registrarFn - async (payload) => liberacao
 */
async function solicitarLiberacaoLimite(contexto = {}, registrarFn) {
  const form = await autorizacaoGerencialDialog({
    title: 'Solicitar Liberação',
    subtitle: 'É necessária autorização de um administrador para ultrapassar o limite comercial.',
    valorEntrega: contexto.valorEntrega,
    creditoDisponivel: contexto.creditoDisponivel,
    valorExcedido: contexto.valorExcedido
  });

  if (!form) return null;

  try {
    const auth = await autenticarAdministrador(form);
    const liberacao = await registrarFn({
      supervisorToken: auth.token,
      dados: {
        clienteId: contexto.clienteId,
        clienteNome: contexto.clienteNome,
        consignacaoId: contexto.consignacaoId,
        valorEntrega: contexto.valorEntrega,
        creditoDisponivel: contexto.creditoDisponivel,
        valorExcedido: contexto.valorExcedido,
        motivo: form.motivo || null,
        fingerprint: contexto.fingerprint
      }
    });

    const result = {
      ...liberacao,
      fingerprint: contexto.fingerprint,
      supervisorToken: auth.token,
      autorizado: true
    };

    if (contexto.consignacaoId) {
      salvarLiberacaoSessao(contexto.consignacaoId, result);
    }

    notify('Liberação autorizada para esta operação.', 'success');
    return result;
  } catch (error) {
    notify(error.message || 'Não foi possível autorizar a liberação.', 'error');
    return null;
  }
}

function salvarLiberacaoSessao(consignacaoId, liberacao) {
  if (typeof sessionStorage === 'undefined' || !consignacaoId) return;
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}${consignacaoId}`, JSON.stringify(liberacao));
  } catch (_e) {
    /* ignore */
  }
}

function carregarLiberacaoSessao(consignacaoId) {
  if (typeof sessionStorage === 'undefined' || !consignacaoId) return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_PREFIX}${consignacaoId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.expiresAt && new Date(data.expiresAt).getTime() < Date.now()) {
      sessionStorage.removeItem(`${SESSION_PREFIX}${consignacaoId}`);
      return null;
    }
    return data;
  } catch (_e) {
    return null;
  }
}

function limparLiberacaoSessao(consignacaoId) {
  if (typeof sessionStorage === 'undefined' || !consignacaoId) return;
  try {
    sessionStorage.removeItem(`${SESSION_PREFIX}${consignacaoId}`);
  } catch (_e) {
    /* ignore */
  }
}

function buildFingerprintLimite({ clienteId, valorEntrega, creditoDisponivel }) {
  return `${clienteId || ''}|${Number(valorEntrega || 0).toFixed(2)}|${Number(creditoDisponivel || 0).toFixed(2)}`;
}

function liberacaoCompativel(liberacao, fingerprint) {
  if (!liberacao?.autorizado) return false;
  if (liberacao.expiresAt && new Date(liberacao.expiresAt).getTime() < Date.now()) return false;
  if (fingerprint && liberacao.fingerprint && liberacao.fingerprint !== fingerprint) return false;
  return true;
}

module.exports = {
  autorizacaoGerencialDialog,
  autenticarAdministrador,
  solicitarLiberacaoLimite,
  salvarLiberacaoSessao,
  carregarLiberacaoSessao,
  limparLiberacaoSessao,
  buildFingerprintLimite,
  liberacaoCompativel,
  SESSION_PREFIX
};
