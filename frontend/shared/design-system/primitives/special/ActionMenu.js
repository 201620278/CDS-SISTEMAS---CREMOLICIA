/**
 * ActionMenu — Special Action Menu Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente ActionMenu.
 *
 * @module frontend/modules/motor-comercial/components/special/ActionMenu
 */

const theme = require('../../theme');

class ActionMenu {
  /**
   * Creates an action menu.
   * @param {Object} options
   * @param {Array} options.actions - Action items
   * @param {string} [options.triggerText] - Trigger button text
   * @param {string} [options.triggerIcon] - Trigger button icon
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      actions = [],
      triggerText = 'Ações',
      triggerIcon = '⋮'
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-action-menu';

    const trigger = document.createElement('button');
    trigger.className = 'cds-action-menu__trigger';
    trigger.innerHTML = triggerIcon;
    trigger.setAttribute('aria-label', triggerText);

    const menu = document.createElement('div');
    menu.className = 'cds-action-menu__menu';
    menu.setAttribute('role', 'menu');

    actions.forEach(action => {
      const menuItem = document.createElement('button');
      menuItem.className = 'cds-action-menu__item';
      menuItem.textContent = action.label;
      menuItem.setAttribute('role', 'menuitem');

      if (action.icon) {
        const icon = document.createElement('span');
        icon.className = 'cds-action-menu__item-icon';
        icon.textContent = action.icon;
        menuItem.insertBefore(icon, menuItem.firstChild);
      }

      if (action.danger) {
        menuItem.classList.add('cds-action-menu__item--danger');
      }

      if (action.onClick) {
        menuItem.addEventListener('click', () => {
          action.onClick();
          this._closeMenu(container);
        });
      }

      menu.appendChild(menuItem);
    });

    container.appendChild(trigger);
    container.appendChild(menu);

    trigger.addEventListener('click', () => {
      menu.classList.toggle('cds-action-menu__menu--open');
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        menu.classList.remove('cds-action-menu__menu--open');
      }
    });

    return container;
  }

  /**
   * Closes the menu.
   * @private
   */
  static _closeMenu(container) {
    const menu = container.querySelector('.cds-action-menu__menu');
    if (menu) {
      menu.classList.remove('cds-action-menu__menu--open');
    }
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-action-menu {
        position: relative;
        display: inline-block;
      }

      .cds-action-menu__trigger {
        background: none;
        border: none;
        font-size: ${t.typography.fontSize.xl};
        cursor: pointer;
        color: ${t.colors.neutral[600]};
        padding: ${t.spacing.xs};
        border-radius: ${t.radius.sm};
        transition: background-color ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-action-menu__trigger:hover {
        background-color: ${t.colors.neutral[100]};
      }

      .cds-action-menu__menu {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: var(--color-surface);
        border: 1px solid ${t.colors.neutral[200]};
        border-radius: ${t.radius.md};
        box-shadow: ${t.shadow.lg};
        min-width: 180px;
        z-index: ${t.zindex.dropdown};
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-action-menu__menu--open {
        opacity: 1;
        visibility: visible;
        transform: translateY(4px);
      }

      .cds-action-menu__item {
        width: 100%;
        padding: ${t.spacing.sm} ${t.spacing.md};
        border: none;
        background: none;
        text-align: left;
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[700]};
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: ${t.spacing.sm};
        transition: background-color ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-action-menu__item:hover {
        background-color: ${t.colors.neutral[50]};
      }

      .cds-action-menu__item--danger {
        color: ${t.colors.error[600]};
      }

      .cds-action-menu__item--danger:hover {
        background-color: ${t.colors.error[50]};
      }

      .cds-action-menu__item-icon {
        font-size: ${t.typography.fontSize.base};
      }
    `;
  }
}

module.exports = ActionMenu;
