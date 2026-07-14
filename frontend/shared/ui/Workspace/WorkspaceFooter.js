/**
 * WorkspaceFooter — Shared UI (FOUNDATION F2 / DS-001)
 *
 * Rodapé fixo de ações. Nunca sai da viewport por scroll do body.
 *
 * @module frontend/shared/ui/Workspace/WorkspaceFooter
 */

const STATUS = 'ready';

/**
 * @param {Object} [options]
 * @param {HTMLElement|HTMLElement[]} [options.children] - ActionBar ou botões
 * @param {HTMLElement|HTMLElement[]} [options.left]
 * @param {HTMLElement|HTMLElement[]} [options.right]
 * @param {string} [options.className]
 * @param {boolean} [options.busy]
 * @returns {HTMLElement}
 */
function create(options = {}) {
  const {
    children = null,
    left = null,
    right = null,
    className = '',
    busy = false
  } = options;

  const footer = document.createElement('footer');
  footer.className = ['cds-workspace__footer', className].filter(Boolean).join(' ');
  footer.dataset.sharedUi = 'WorkspaceFooter';
  footer.setAttribute('role', 'contentinfo');
  if (busy) {
    footer.dataset.busy = 'true';
    footer.setAttribute('aria-busy', 'true');
  }

  if (children) {
    const slot = document.createElement('div');
    slot.className = 'cds-workspace__footer-slot';
    appendNodes(slot, children);
    footer.appendChild(slot);
    return footer;
  }

  const row = document.createElement('div');
  row.className = 'cds-workspace__footer-row';

  const leftEl = document.createElement('div');
  leftEl.className = 'cds-workspace__footer-left';
  if (left) appendNodes(leftEl, left);

  const rightEl = document.createElement('div');
  rightEl.className = 'cds-workspace__footer-right';
  if (right) appendNodes(rightEl, right);

  row.appendChild(leftEl);
  row.appendChild(rightEl);
  footer.appendChild(row);

  return footer;
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

/**
 * @param {HTMLElement} footerEl
 * @param {boolean} busy
 */
function setBusy(footerEl, busy) {
  if (!footerEl) return;
  if (busy) {
    footerEl.dataset.busy = 'true';
    footerEl.setAttribute('aria-busy', 'true');
  } else {
    delete footerEl.dataset.busy;
    footerEl.removeAttribute('aria-busy');
  }
}

module.exports = {
  STATUS,
  NAME: 'WorkspaceFooter',
  create,
  setBusy
};
