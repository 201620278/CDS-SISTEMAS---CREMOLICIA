/**
 * Timeline — Componente oficial de timeline de eventos.
 *
 * Sprint O-2: Fluxo Operacional da Consignação.
 *
 * @module frontend/modules/motor-comercial/components/special/Timeline
 */

const theme = require('../../theme');
const EmptyState = require('../base/EmptyState');

class Timeline {
  /**
   * Cria elemento de timeline.
   * @param {Object} options
   * @param {Array} [options.events] - Eventos { data/dataMovimentacao, tipo, descricao/descricaoResumo }
   * @param {string} [options.emptyTitle]
   * @param {string} [options.emptyDescription]
   * @returns {HTMLElement}
   */
  static create(options = {}) {
    const {
      events = [],
      emptyTitle = 'Sem eventos',
      emptyDescription = 'Nenhum evento registrado'
    } = options;

    const container = document.createElement('div');
    container.className = 'cds-timeline';

    if (!events.length) {
      return EmptyState.create({ title: emptyTitle, description: emptyDescription });
    }

    events.forEach((event) => {
      const item = document.createElement('div');
      item.className = 'cds-timeline-item';

      const date = document.createElement('div');
      date.className = 'cds-timeline-item__date';
      date.textContent = Timeline._formatDate(event.data || event.dataMovimentacao || event.timestamp);
      item.appendChild(date);

      const content = document.createElement('div');
      content.className = 'cds-timeline-item__content';

      const type = document.createElement('div');
      type.className = 'cds-timeline-item__type';
      type.textContent = event.tipo || event.tipoMovimentacao || event.titulo || 'Evento';
      content.appendChild(type);

      const description = document.createElement('div');
      description.className = 'cds-timeline-item__description';
      description.textContent = event.descricao || event.descricaoResumo || event.mensagem || '';
      content.appendChild(description);

      item.appendChild(content);
      container.appendChild(item);
    });

    return container;
  }

  /**
   * @private
   */
  static _formatDate(value) {
    if (!value) return '-';
    return new Date(value).toLocaleString('pt-BR');
  }

  /**
   * @returns {string}
   */
  static getStyles() {
    const t = theme;
    return `
      .cds-timeline {
        display: flex;
        flex-direction: column;
        gap: ${t.spacing.md};
        padding-left: ${t.spacing.sm};
      }

      .cds-timeline-item {
        position: relative;
        padding-left: ${t.spacing.lg};
        border-left: 2px solid ${t.colors.primary[200]};
      }

      .cds-timeline-item::before {
        content: '';
        position: absolute;
        left: -6px;
        top: 4px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: ${t.colors.primary[500]};
      }

      .cds-timeline-item__date {
        font-size: ${t.typography.fontSize.xs};
        color: ${t.colors.neutral[500]};
        margin-bottom: ${t.spacing.xs};
      }

      .cds-timeline-item__type {
        font-size: ${t.typography.fontSize.sm};
        font-weight: ${t.typography.fontWeight.semibold};
        color: ${t.colors.neutral[800]};
      }

      .cds-timeline-item__description {
        font-size: ${t.typography.fontSize.sm};
        color: ${t.colors.neutral[600]};
      }
    `;
  }
}

module.exports = Timeline;
