/**
 * Table — Data Table Component
 *
 * Sprint 2.7: Arquitetura Frontend — componente Table.
 *
 * @module frontend/modules/motor-comercial/components/data/Table
 */

const theme = require('../../theme');

class Table {
  /**
   * Creates a table element.
   * @param {Object} options
   * @param {Array} options.columns - Column definitions
   * @param {Array} options.data - Table data
   * @param {boolean} [options.sortable=false] - Enable sorting
   * @param {boolean} [options.selectable=false] - Enable row selection
   * @param {Function} [options.onSort] - Sort handler
   * @param {Function} [options.onRowClick] - Row click handler
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      columns = [],
      data = [],
      sortable = false,
      selectable = false,
      onSort = null,
      onRowClick = null
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-table-container';

    const table = document.createElement('table');
    table.className = 'cds-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    if (selectable) {
      const th = document.createElement('th');
      th.className = 'cds-table__checkbox';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'cds-table__select-all';
      th.appendChild(checkbox);
      headerRow.appendChild(th);
    }

    columns.forEach((col, index) => {
      const th = document.createElement('th');
      th.className = 'cds-table__header';
      th.textContent = col.label;

      if (sortable && col.sortable !== false) {
        th.className += ' cds-table__header--sortable';
        th.style.cursor = 'pointer';
        
        if (onSort) {
          th.addEventListener('click', () => onSort(col.key));
        }
      }

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    tbody.className = 'cds-table__body';

    data.forEach((row, rowIndex) => {
      const tr = document.createElement('tr');
      tr.className = 'cds-table__row';

      if (onRowClick) {
        tr.style.cursor = 'pointer';
        tr.addEventListener('click', () => onRowClick(row, rowIndex));
      }

      if (selectable) {
        const td = document.createElement('td');
        td.className = 'cds-table__checkbox';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'cds-table__select-row';
        checkbox.dataset.rowIndex = rowIndex;
        td.appendChild(checkbox);
        tr.appendChild(td);
      }

      columns.forEach(col => {
        const td = document.createElement('td');
        td.className = 'cds-table__cell';
        
        if (col.render) {
          td.appendChild(col.render(row[col.key], row));
        } else {
          const value = row[col.key];
          if (value instanceof HTMLElement) {
            td.appendChild(value);
          } else if (value != null && value !== '') {
            td.textContent = String(value);
          }
        }
        
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    container.appendChild(table);

    return container;
  }

  /**
   * Gets CSS styles.
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-table-container {
        overflow-x: auto;
        border: 1px solid ${t.components.table.borderColor};
        border-radius: ${t.radius.md};
      }

      .cds-table {
        width: 100%;
        border-collapse: collapse;
        background-color: var(--color-surface);
      }

      .cds-table__header {
        padding: ${t.spacing.sm} ${t.spacing.md};
        text-align: left;
        font-size: ${t.typography.fontSize.sm};
        font-weight: ${t.typography.fontWeight.semibold};
        color: ${t.components.table.headerTextColor};
        background-color: ${t.components.table.headerBackgroundColor};
        border-bottom: 2px solid ${t.components.table.borderColor};
        white-space: nowrap;
      }

      .cds-table__header--sortable {
        cursor: pointer;
        user-select: none;
      }

      .cds-table__header--sortable:hover {
        background-color: ${t.colors.neutral[100]};
      }

      .cds-table__checkbox {
        width: 40px;
        text-align: center;
      }

      .cds-table__row {
        border-bottom: 1px solid ${t.colors.neutral[100]};
        transition: background-color ${t.animations.duration.fast} ${t.animations.easing.easeInOut};
      }

      .cds-table__row:hover {
        background-color: ${t.components.table.rowHoverBackgroundColor};
      }

      .cds-table__cell {
        padding: ${t.spacing.sm} ${t.spacing.md};
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[700]};
      }

      .cds-table__select-all,
      .cds-table__select-row {
        cursor: pointer;
      }
    `;
  }
}

module.exports = Table;
