/**
 * CDSOperationalCard — Card de ação operacional
 *
 * @module frontend/shared/design-system/components/cards/CDSOperationalCard
 */

const theme = require('../../theme');
const CDSPrimaryButton = require('../buttons/CDSPrimaryButton');

class CDSOperationalCard {
  static create(options = {}) {
    const {
      icon = '📋', title = '', description = '', actionLabel = 'Acessar', onAction = null, variant = 'default'
    } = options;

    const card = document.createElement('article');
    card.className = `cds-operational-card cds-operational-card--${variant}`;

    card.innerHTML = `
      <div class="cds-operational-card__icon">${icon}</div>
      <h3 class="cds-operational-card__title">${title}</h3>
      <p class="cds-operational-card__description">${description}</p>
    `;

    if (onAction) {
      card.appendChild(CDSPrimaryButton.create({ text: actionLabel, onClick: onAction, fullWidth: true }));
    }

    return card;
  }

  static getStyles() {
    const t = theme;
    return `
      .cds-operational-card {
        padding: ${t.spacing.lg}; background: var(--color-surface); border: 1px solid ${t.colors.neutral[200]};
        border-radius: ${t.radius.lg}; box-shadow: ${t.shadow.sm};
        display: flex; flex-direction: column; gap: ${t.spacing.sm};
      }
      .cds-operational-card__icon { font-size: 28px; }
      .cds-operational-card__title { margin: 0; font-size: ${t.typography.fontSize.lg}; font-weight: ${t.typography.fontWeight.semibold}; }
      .cds-operational-card__description { margin: 0 0 ${t.spacing.sm}; font-size: ${t.typography.fontSize.sm}; color: ${t.colors.neutral[600]}; flex: 1; }
      .cds-operational-card--highlight { border-color: ${t.colors.primary[300]}; background: ${t.colors.primary[50]}; }
    `;
  }
}

module.exports = CDSOperationalCard;
