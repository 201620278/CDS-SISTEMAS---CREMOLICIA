/**
 * Contexto de navegação operacional — Sprint S-5.1 / UX-03
 *
 * Regra: operações iniciadas no Cliente ou na Central de Trabalho
 * reutilizam o cliente atual e retornam à origem correta.
 *
 * @module frontend/modules/motor-comercial/utils/cliente360Context
 */

const ORIGEM_CLIENTE_360 = 'cliente360';
const ORIGEM_CENTRAL_TRABALHO = 'central';

/**
 * @param {Object} [query]
 * @returns {boolean}
 */
function isFromCliente360(query = {}) {
  return String(query.origem || '').toLowerCase() === ORIGEM_CLIENTE_360;
}

/**
 * @param {Object} [query]
 * @returns {boolean}
 */
function isFromCentralTrabalho(query = {}) {
  return String(query.origem || '').toLowerCase() === ORIGEM_CENTRAL_TRABALHO;
}

/**
 * @param {Object} [query]
 * @returns {{ origem: string|null, clienteId: number|null, locked: boolean, skipClienteSelection: boolean }}
 */
function parseNavigationContext(query = {}) {
  const origemRaw = String(query.origem || '').toLowerCase();
  const from360 = origemRaw === ORIGEM_CLIENTE_360;
  const fromCentral = origemRaw === ORIGEM_CENTRAL_TRABALHO;
  const rawId = query.clienteId;
  const clienteId = rawId != null && rawId !== '' ? Number(rawId) : null;
  const validId = Number.isFinite(clienteId) && clienteId > 0 ? clienteId : null;

  return {
    origem: from360 ? ORIGEM_CLIENTE_360 : (fromCentral ? ORIGEM_CENTRAL_TRABALHO : null),
    clienteId: validId,
    locked: (from360 || fromCentral) && !!validId,
    skipClienteSelection: (from360 || fromCentral) && !!validId
  };
}

/**
 * @param {Object} [query]
 * @returns {{ origem: string|null, clienteId: number|null, locked: boolean, skipClienteSelection: boolean }}
 */
function parseCliente360Context(query = {}) {
  return parseNavigationContext(query);
}

/**
 * @param {number|string} clienteId
 * @param {Record<string, string|number|boolean|null|undefined>} [extra]
 * @returns {string}
 */
function buildCliente360Query(clienteId, extra = {}) {
  const params = new URLSearchParams({
    clienteId: String(clienteId),
    origem: ORIGEM_CLIENTE_360
  });

  Object.entries(extra).forEach(([key, value]) => {
    if (value != null && value !== '') {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

/**
 * @param {number|string} [clienteId]
 * @param {Record<string, string|number|boolean|null|undefined>} [extra]
 * @returns {string}
 */
function buildCentralTrabalhoQuery(clienteId, extra = {}) {
  const params = new URLSearchParams({ origem: ORIGEM_CENTRAL_TRABALHO });

  if (clienteId != null && clienteId !== '') {
    params.set('clienteId', String(clienteId));
  }

  Object.entries(extra).forEach(([key, value]) => {
    if (value != null && value !== '') {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

/**
 * @param {string} path
 * @param {number|string} clienteId
 * @param {Record<string, string|number|boolean|null|undefined>} [extra]
 * @returns {string}
 */
function buildRouteWithCliente360Context(path, clienteId, extra = {}) {
  const query = buildCliente360Query(clienteId, extra);
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${query}`;
}

/**
 * @param {string} path
 * @param {number|string} [clienteId]
 * @param {Record<string, string|number|boolean|null|undefined>} [extra]
 * @returns {string}
 */
function buildRouteWithCentralTrabalhoContext(path, clienteId, extra = {}) {
  const query = buildCentralTrabalhoQuery(clienteId, extra);
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}${query}`;
}

/**
 * @param {number|string} clienteId
 * @returns {string}
 */
function getCliente360ReturnPath(clienteId) {
  return `/clientes/${clienteId}`;
}

/**
 * @returns {string}
 */
function getCentralTrabalhoReturnPath() {
  return '/';
}

/**
 * Rota de retorno conforme origem da navegação.
 * @param {{ origem?: string|null, clienteId?: number|null }} navigationContext
 * @param {string} [defaultPath='/']
 * @returns {string}
 */
function resolveBackPath(navigationContext, defaultPath = '/') {
  if (navigationContext?.origem === ORIGEM_CLIENTE_360 && navigationContext?.clienteId) {
    return getCliente360ReturnPath(navigationContext.clienteId);
  }
  if (navigationContext?.origem === ORIGEM_CENTRAL_TRABALHO) {
    return getCentralTrabalhoReturnPath();
  }
  return defaultPath;
}

/**
 * Propaga contexto ativo em navegações internas.
 * @param {string} path
 * @param {{ locked?: boolean, clienteId?: number|null, origem?: string|null }} navigationContext
 * @param {Record<string, string|number|boolean|null|undefined>} [extra]
 * @returns {string}
 */
function routeWithActiveContext(path, navigationContext, extra = {}) {
  if (navigationContext?.locked && navigationContext?.clienteId) {
    if (navigationContext.origem === ORIGEM_CENTRAL_TRABALHO) {
      return buildRouteWithCentralTrabalhoContext(path, navigationContext.clienteId, extra);
    }
    return buildRouteWithCliente360Context(path, navigationContext.clienteId, extra);
  }
  return path;
}

/**
 * Label de cancelar/voltar conforme contexto.
 * @param {{ locked?: boolean, origem?: string|null }} navigationContext
 * @param {string} [defaultLabel='Cancelar']
 * @returns {string}
 */
function getBackButtonLabel(navigationContext, defaultLabel = 'Cancelar') {
  if (navigationContext?.origem === ORIGEM_CENTRAL_TRABALHO) {
    return 'Voltar à Central de Trabalho';
  }
  if (navigationContext?.locked || navigationContext?.origem === ORIGEM_CLIENTE_360) {
    return 'Voltar à Central do Cliente';
  }
  return defaultLabel;
}

module.exports = {
  ORIGEM_CLIENTE_360,
  ORIGEM_CENTRAL_TRABALHO,
  isFromCliente360,
  isFromCentralTrabalho,
  parseNavigationContext,
  parseCliente360Context,
  buildCliente360Query,
  buildCentralTrabalhoQuery,
  buildRouteWithCliente360Context,
  buildRouteWithCentralTrabalhoContext,
  getCliente360ReturnPath,
  getCentralTrabalhoReturnPath,
  resolveBackPath,
  routeWithActiveContext,
  getBackButtonLabel
};
