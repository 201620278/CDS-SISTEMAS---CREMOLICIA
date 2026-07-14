/**
 * Drawer — Special Drawer Component
 * Sprint DS-02 — estilos em components/drawers.css
 */

class Drawer {
  static create(options = {}) {
    const {
      title = '',
      content = null,
      footer = null,
      size = 'md',
      open = false,
      onClose = null
    } = options;

    const backdrop = document.createElement('div');
    backdrop.className = `cds-drawer-backdrop${open ? ' cds-drawer-backdrop--open' : ''}`;
    backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');

    const drawer = document.createElement('aside');
    drawer.className = `cds-drawer cds-drawer--${size}${open ? ' cds-drawer--open' : ''}`;
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-labelledby', 'drawer-title');

    const header = document.createElement('div');
    header.className = 'cds-drawer__header';

    const titleEl = document.createElement('h2');
    titleEl.id = 'drawer-title';
    titleEl.className = 'cds-drawer__title cds-subtitle';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'cds-drawer__close';
    closeBtn.innerHTML = '✕';
    closeBtn.setAttribute('aria-label', 'Fechar');

    const close = () => {
      drawer.classList.remove('cds-drawer--open');
      backdrop.classList.remove('cds-drawer-backdrop--open');
      backdrop.setAttribute('aria-hidden', 'true');
      document.removeEventListener('keydown', handleEscape);
      setTimeout(() => {
        backdrop.remove();
        if (onClose) onClose();
      }, 300);
    };

    closeBtn.addEventListener('click', close);
    header.appendChild(closeBtn);
    drawer.appendChild(header);

    const body = document.createElement('div');
    body.className = 'cds-drawer__body';
    if (content) body.appendChild(content);
    drawer.appendChild(body);

    if (footer) {
      const footerEl = document.createElement('div');
      footerEl.className = 'cds-drawer__footer';
      footerEl.appendChild(footer);
      drawer.appendChild(footerEl);
    }

    backdrop.appendChild(drawer);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    const handleEscape = (e) => {
      if (e.key === 'Escape') close();
    };
    if (open) document.addEventListener('keydown', handleEscape);

    return backdrop;
  }

  static getStyles() {
    return '';
  }
}

module.exports = Drawer;
