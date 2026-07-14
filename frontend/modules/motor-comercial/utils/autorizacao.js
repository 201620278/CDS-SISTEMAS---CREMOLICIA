/**
 * Autorização RBAC — alinhado ao UsuarioPlatformGateway / auth CDS.
 *
 * Sprint H-2: substitui verificação "usuário logado" por permissões oficiais.
 *
 * @module frontend/modules/motor-comercial/utils/autorizacao
 */

const PERMISSOES_OPERACAO_COMERCIAL = Object.freeze([
  'COMERCIAL_CONSIGNACAO',
  'COMERCIAL_ACERTO'
]);

const PERMISSAO_LIMITE_COMERCIAL = 'COMERCIAL_LIMITE';

const PERFIS_ADMIN = Object.freeze(['ADMIN', 'SUPER_ADMIN']);
const PERFIS_SUPERVISOR = Object.freeze(['SUPERVISOR', ...PERFIS_ADMIN]);

function getUsuarioLogado() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizarPerfil(perfil) {
  return String(perfil || '').trim().toUpperCase();
}

function isAdminOuSupervisor(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const perfil = normalizarPerfil(user.perfil);
  return PERFIS_SUPERVISOR.includes(perfil) || user.role === 'supervisor';
}

/**
 * Espelha UsuarioPlatformGateway.possuiPermissao.
 * @param {string} permissao
 * @returns {boolean}
 */
function possuiPermissao(permissao) {
  const user = getUsuarioLogado();
  if (!user?.id) return false;
  if (isAdminOuSupervisor(user)) return true;

  const permissoes = Array.isArray(user.permissoes) ? user.permissoes : [];
  return permissoes.includes(permissao);
}

/**
 * Operador autorizado para entrega e prestação.
 * @returns {boolean}
 */
function isOperadorAutorizado() {
  const user = getUsuarioLogado();
  if (!user?.id) return false;
  if (isAdminOuSupervisor(user)) return true;
  return PERMISSOES_OPERACAO_COMERCIAL.some((p) => possuiPermissao(p));
}

/**
 * Autorização gerencial (reabertura, liberações).
 * @returns {boolean}
 */
function isAutorizacaoGerencial() {
  const user = getUsuarioLogado();
  if (!user?.id) return false;
  return isAdminOuSupervisor(user);
}

/**
 * Permite alterar limite comercial do perfil (admin ou COMERCIAL_LIMITE).
 * Supervisor sem permissão explícita não altera limite (alinhado ao gateway).
 * @returns {boolean}
 */
function podeAlterarLimiteComercial() {
  const user = getUsuarioLogado();
  if (!user?.id) return false;
  if (user.role === 'admin') return true;
  const perfil = normalizarPerfil(user.perfil);
  if (PERFIS_ADMIN.includes(perfil)) return true;
  const permissoes = Array.isArray(user.permissoes) ? user.permissoes : [];
  return permissoes.includes(PERMISSAO_LIMITE_COMERCIAL);
}

module.exports = {
  PERMISSOES_OPERACAO_COMERCIAL,
  PERMISSAO_LIMITE_COMERCIAL,
  getUsuarioLogado,
  possuiPermissao,
  isOperadorAutorizado,
  isAutorizacaoGerencial,
  podeAlterarLimiteComercial
};
