/**
 * WorkspaceHeader — Shared UI (FOUNDATION F2 / DS-001)
 *
 * Cabeçalho fixo da Estação/Central. Sem KPIs, filtros complexos ou gráficos.
 *
 * @module frontend/shared/ui/Workspace/WorkspaceHeader
 */

const STATUS = 'ready';

/**
 * @param {Object} [options]
 * @param {string} [options.title]
 * @param {string} [options.subtitle]
 * @param {string|HTMLElement|HTMLElement[]} [options.context]
 * @param {string|HTMLElement} [options.status]
 * @param {string|HTMLElement} [options.operator]
 * @param {string} [options.updatedAt]
 * @param {HTMLElement|HTMLElement[]} [options.breadcrumb]
 * @param {HTMLElement|HTMLElement[]} [options.secondaryActions]
 * @param {Function} [options.onBack]
 * @param {string} [options.className]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  const {
    title = '',
    subtitle = '',
    context = null,
    status = null,
    operator = null,
    updatedAt = null,
    breadcrumb = null,
    secondaryActions = null,
    onBack = null,
    className = ''
  } = options;

  const header = document.createElement('header');
  header.className = ['cds-workspace__header', className].filter(Boolean).join(' ');
  header.dataset.sharedUi = 'WorkspaceHeader';
  header.setAttribute('role', 'banner');

  if (breadcrumb) {
    const crumb = document.createElement('div');
    crumb.className = 'cds-workspace__breadcrumb';
    appendNodes(crumb, breadcrumb);
    header.appendChild(crumb);
  }

  const top = document.createElement('div');
  top.className = 'cds-workspace__header-top';

  if (typeof onBack === 'function') {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'cds-workspace__back';
    back.setAttribute('aria-label', 'Voltar');
    back.textContent = '←';
    back.addEventListener('click', onBack);
    top.appendChild(back);
  }

  const titles = document.createElement('div');
  titles.className = 'cds-workspace__titles';

  const h1 = document.createElement('h1');
  h1.className = 'cds-workspace__title';
  h1.id = options.titleId || 'cds-workspace-title';
  h1.textContent = title;
  titles.appendChild(h1);

  if (subtitle) {
    const sub = document.createElement('p');
    sub.className = 'cds-workspace__subtitle';
    sub.textContent = subtitle;
    titles.appendChild(sub);
  }

  top.appendChild(titles);

  const meta = document.createElement('div');
  meta.className = 'cds-workspace__header-meta';

  if (status != null && status !== '') {
    const statusWrap = document.createElement('div');
    statusWrap.className = 'cds-workspace__status';
    if (typeof status === 'string') {
      statusWrap.textContent = status;
    } else {
      appendNodes(statusWrap, status);
    }
    meta.appendChild(statusWrap);
  }

  if (operator != null && operator !== '') {
    const op = document.createElement('div');
    op.className = 'cds-workspace__operator';
    if (typeof operator === 'string') {
      op.textContent = operator;
    } else {
      appendNodes(op, operator);
    }
    meta.appendChild(op);
  }

  if (updatedAt) {
    const upd = document.createElement('div');
    upd.className = 'cds-workspace__updated-at';
    upd.textContent = updatedAt;
    meta.appendChild(upd);
  }

  if (secondaryActions) {
    const actions = document.createElement('div');
    actions.className = 'cds-workspace__header-actions';
    appendNodes(actions, secondaryActions);
    meta.appendChild(actions);
  }

  if (meta.childNodes.length) {
    top.appendChild(meta);
  }

  header.appendChild(top);

  if (context != null && context !== '') {
    const ctx = document.createElement('div');
    ctx.className = 'cds-workspace__context';
    if (typeof context === 'string') {
      ctx.textContent = context;
    } else {
      appendNodes(ctx, context);
    }
    header.appendChild(ctx);
  }

  return header;
}

function appendNodes(parent, nodes) {
  const list = Array.isArray(nodes) ? nodes : [nodes];
  list.forEach((node) => {
    if (node == null) return;
    if (typeof node === 'string') {
      parent.appendChild(document.createTextNode(node));
    } else {
      parent.appendChild(node);
    }
  });
}

module.exports = {
  STATUS,
  NAME: 'WorkspaceHeader',
  create,
  appendNodes
};
