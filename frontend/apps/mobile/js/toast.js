/**
 * CDS Mobile RC1 — Toast
 * Copyright (c) 2026 CDS Sistemas
 * Classes .cds-toast* do Design System.
 */
export function showToast(message, variant = 'info', duration = 4000) {
  let viewport = document.getElementById('cds-toast-viewport');
  if (!viewport) {
    viewport = document.createElement('div');
    viewport.id = 'cds-toast-viewport';
    viewport.className = 'cds-toast-viewport';
    document.body.appendChild(viewport);
  }

  const toast = document.createElement('div');
  toast.className = `cds-toast cds-toast--${variant || 'info'}`;
  toast.setAttribute('role', 'alert');

  const text = document.createElement('span');
  text.className = 'cds-toast__message';
  text.textContent = String(message || '');
  toast.appendChild(text);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'cds-toast__close';
  close.setAttribute('aria-label', 'Fechar');
  close.textContent = '×';
  close.addEventListener('click', () => toast.remove());
  toast.appendChild(close);

  viewport.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 180);
    }, duration);
  }

  return toast;
}

export default { showToast };
