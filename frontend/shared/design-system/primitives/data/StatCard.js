/**
 * StatCard — Data StatCard Component
 * Sprint DS-02 — estilos em components/stat-cards.css
 */

class StatCard {
  static create(options = {}) {
    const {
      title = '',
      value = '',
      trend = null,
      trendValue = null,
      icon = null,
      color = 'primary',
      interactive = false
    } = options;

    const card = document.createElement('div');
    card.className = `cds-stat-card cds-stat-card--${color}${interactive ? ' cds-stat-card--interactive' : ''}`;

    const header = document.createElement('div');
    header.className = 'cds-stat-card__header';

    if (icon) {
      const iconEl = document.createElement('div');
      iconEl.className = 'cds-stat-card__icon';
      iconEl.innerHTML = icon;
      header.appendChild(iconEl);
    }

    const titleEl = document.createElement('div');
    titleEl.className = 'cds-stat-card__title';
    titleEl.textContent = title;
    header.appendChild(titleEl);

    card.appendChild(header);

    const valueEl = document.createElement('div');
    valueEl.className = 'cds-stat-card__value';
    valueEl.textContent = value;
    card.appendChild(valueEl);

    if (trend && trendValue !== null) {
      const trendEl = document.createElement('div');
      trendEl.className = `cds-stat-card__trend cds-stat-card__trend--${trend}`;
      const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
      trendEl.textContent = `${trendIcon} ${Math.abs(trendValue)}%`;
      card.appendChild(trendEl);
    }

    return card;
  }

  static getStyles() {
    return '';
  }
}

module.exports = StatCard;
