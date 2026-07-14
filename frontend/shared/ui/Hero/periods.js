/**
 * CDS Hero — período do dia (Shared UI, sem domínio de motor)
 * @module frontend/shared/ui/Hero/periods
 */

const PERIODS = Object.freeze({
  morning: 'morning',
  afternoon: 'afternoon',
  sunset: 'sunset',
  night: 'night'
});

/**
 * Resolve período visual/saudação pelo horário local.
 * 05:00–11:59 morning · 12:00–16:59 afternoon · 17:00–18:59 sunset · 19:00–04:59 night
 * @param {Date} [date]
 * @returns {'morning'|'afternoon'|'sunset'|'night'}
 */
function resolvePeriod(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 12) return PERIODS.morning;
  if (h >= 12 && h < 17) return PERIODS.afternoon;
  if (h >= 17 && h < 19) return PERIODS.sunset;
  return PERIODS.night;
}

/**
 * @param {'morning'|'afternoon'|'sunset'|'night'} period
 * @returns {{ emoji: string, salutation: string }}
 */
function greetingForPeriod(period) {
  switch (period) {
    case PERIODS.morning:
      return { emoji: '☀️', salutation: 'Bom dia' };
    case PERIODS.afternoon:
      return { emoji: '☀️', salutation: 'Boa tarde' };
    case PERIODS.sunset:
      return { emoji: '🌇', salutation: 'Boa tarde' };
    case PERIODS.night:
    default:
      return { emoji: '🌙', salutation: 'Boa noite' };
  }
}

/**
 * @param {Date} [date]
 * @returns {{ dateLabel: string, timeLabel: string, fullLabel: string }}
 */
function formatHeroDateTime(date = new Date()) {
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dayMonthYear = date.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const timeLabel = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return {
    dateLabel: `${weekdayCap}, ${dayMonthYear}`,
    timeLabel,
    fullLabel: `Hoje é ${weekdayCap}, ${dayMonthYear} • ${timeLabel}`
  };
}

module.exports = {
  PERIODS,
  resolvePeriod,
  greetingForPeriod,
  formatHeroDateTime
};
