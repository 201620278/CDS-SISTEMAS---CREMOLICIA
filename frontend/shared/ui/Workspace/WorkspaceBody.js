/**
 * WorkspaceBody — Shared UI (FOUNDATION F2 / DS-001)
 *
 * Única região autorizada a rolar verticalmente dentro do Workspace.
 *
 * @module frontend/shared/ui/Workspace/WorkspaceBody
 */

const STATUS = 'ready';

/**
 * @param {Object} [options]
 * @param {HTMLElement|HTMLElement[]|string} [options.children]
 * @param {string} [options.className]
 * @param {boolean} [options.scroll=true]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  const {
    children = null,
    className = '',
    scroll = true
  } = options;

  const body = document.createElement('main');
  body.className = [
    'cds-workspace__body',
    scroll ? 'cds-workspace__body--scroll' : 'cds-workspace__body--clip',
    className
  ].filter(Boolean).join(' ');
  body.dataset.sharedUi = 'WorkspaceBody';
  body.setAttribute('role', 'main');

  if (children != null) {
    const list = Array.isArray(children) ? children : [children];
    list.forEach((child) => {
      if (child == null) return;
      if (typeof child === 'string') {
        const p = document.createElement('p');
        p.textContent = child;
        body.appendChild(p);
      } else {
        body.appendChild(child);
      }
    });
  }

  return body;
}

/**
 * Substitui o conteúdo do body preservando o container.
 * @param {HTMLElement} bodyEl
 * @param {HTMLElement|HTMLElement[]|string|null} children
 */
function setContent(bodyEl, children) {
  if (!bodyEl) return;
  bodyEl.innerHTML = '';
  if (children == null) return;
  const list = Array.isArray(children) ? children : [children];
  list.forEach((child) => {
    if (child == null) return;
    if (typeof child === 'string') {
      const p = document.createElement('p');
      p.textContent = child;
      bodyEl.appendChild(p);
    } else {
      bodyEl.appendChild(child);
    }
  });
}

module.exports = {
  STATUS,
  NAME: 'WorkspaceBody',
  create,
  setContent
};
