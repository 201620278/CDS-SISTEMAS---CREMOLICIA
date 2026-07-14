/**
 * Pagination — Data Pagination Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Pagination.
 *
 * @module frontend/modules/motor-comercial/components/data/Pagination
 */

const theme = require('../../theme');

class Pagination {
  /**
   * Creates a pagination element.
   * @param {Object} options
   * @param {number} options.currentPage - Current page
   * @param {number} options.totalPages - Total pages
   * @param {number} options.totalItems - Total items
   * @param {number} [options.pageSize=10] - Page size
   * @param {Function} [options.onPageChange] - Page change handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      currentPage = 1,
      totalPages = 1,
      totalItems = 0,
      pageSize = 10,
      onPageChange = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-pagination';

    const info = document.createElement('div');
    info.className = 'cds-pagination__info';
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    info.textContent = totalItems > 0 
      ? `${startItem}-${endItem} de ${totalItems}`
      : '0 itens';
    container.appendChild(info);

    const controls = document.createElement('div');
    controls.className = 'cds-pagination__controls';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'cds-pagination__button';
    prevBtn.textContent = '‹';
    prevBtn.disabled = currentPage === 1;
    
    if (onPageChange && currentPage > 1) {
      prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
    }
    
    controls.appendChild(prevBtn);

    const pageNumbers = this._getPageNumbers(currentPage, totalPages);
    pageNumbers.forEach(page => {
      const pageBtn = document.createElement('button');
      pageBtn.className = `cds-pagination__button ${page === currentPage ? 'cds-pagination__button--active' : ''}`;
      pageBtn.textContent = page;
      
      if (onPageChange && page !== currentPage) {
        pageBtn.addEventListener('click', () => onPageChange(page));
      }
      
      controls.appendChild(pageBtn);
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'cds-pagination__button';
    nextBtn.textContent = '›';
    nextBtn.disabled = currentPage === totalPages;
    
    if (onPageChange && currentPage < totalPages) {
      nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
    }
    
    controls.appendChild(nextBtn);

    container.appendChild(controls);

    return container;
  }

  /**
   * Gets page numbers to display.
   * @private
   */
  static _getPageNumbers(current, total) {
    const pages = [];
    const maxVisible = 5;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current <= 3) {
        for (let i = 2; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push('...');
        for (let i = total - 3; i <= total; i++) pages.push(i);
      } else {
        pages.push('...');
        pages.push(current - 1);
        pages.push(current);
        pages.push(current + 1);
        pages.push('...');
        pages.push(total);
      }
    }

    return pages;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: ${t.spacing.md} 0;
        gap: ${t.spacing.md};
      }

      .cds-pagination__info {
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[600]};
      }

      .cds-pagination__controls {
        display: flex;
        gap: ${t.spacing.xs};
      }

      .cds-pagination__button {
        min-width: 36px;
        height: 36px;
        padding: 0 ${t.spacing.sm};
        border: 1px solid ${t.colors.neutral[300]};
        border-radius: ${t.radius.sm};
        background-color: var(--color-surface);
        font-size: ${t.typography.fontSize.sm};
        cursor: pointer;
        transition: all ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-pagination__button:hover:not(:disabled) {
        background-color: ${t.colors.neutral[50]};
        border-color: ${t.colors.neutral[400]};
      }

      .cds-pagination__button--active {
        background-color: ${t.colors.primary[600]};
        color: var(--color-action-text);
        border-color: ${t.colors.primary[600]};
      }

      .cds-pagination__button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `;
  }
}

module.exports = Pagination;
