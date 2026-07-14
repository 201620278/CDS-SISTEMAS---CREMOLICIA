/**
 * Tabs — Navigation Tabs Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Tabs.
 *
 * @module frontend/modules/motor-comercial/components/navigation/Tabs
 */

const theme = require('../../theme');

class Tabs {
  /**
   * Creates a tabs element.
   * @param {Object} options
   * @param {Array} options.tabs - Tab definitions
   * @param {string} [options.activeTab] - Active tab key
   * @param {Function} [options.onTabChange] - Tab change handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      tabs = [],
      activeTab = null,
      onTabChange = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-tabs';

    const tabList = document.createElement('div');
    tabList.className = 'cds-tabs__list';
    tabList.setAttribute('role', 'tablist');

    tabs.forEach(tab => {
      const tabButton = document.createElement('button');
      tabButton.className = `cds-tabs__tab ${tab.key === activeTab ? 'cds-tabs__tab--active' : ''}`;
      tabButton.textContent = tab.label;
      tabButton.setAttribute('role', 'tab');
      tabButton.setAttribute('aria-selected', tab.key === activeTab);

      if (onTabChange && tab.key !== activeTab) {
        tabButton.addEventListener('click', () => onTabChange(tab.key));
      }

      tabList.appendChild(tabButton);
    });

    container.appendChild(tabList);

    return container;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-tabs {
        border-bottom: 1px solid ${t.colors.neutral[200]};
      }

      .cds-tabs__list {
        display: flex;
        gap: ${t.spacing.sm};
      }

      .cds-tabs__tab {
        padding: ${t.spacing.sm} ${t.spacing.md};
        border: none;
        background: none;
        font-size: ${t.typography.fontSize.base};
        font-weight: ${t.typography.fontWeight.medium};
        color: ${t.colors.neutral[600]};
        cursor: pointer;
        border-bottom: 2px solid transparent;
        transition: all ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-tabs__tab:hover {
        color: ${t.colors.primary[600]};
      }

      .cds-tabs__tab--active {
        color: ${t.colors.primary[600]};
        border-bottom-color: ${t.colors.primary[600]};
      }
    `;
  }
}

module.exports = Tabs;
