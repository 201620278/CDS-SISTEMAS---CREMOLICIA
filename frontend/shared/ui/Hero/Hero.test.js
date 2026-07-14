/**
 * Hero Shared UI — testes UX-21.1 / wallpaper UX-21.3
 */

const Hero = require('./index');
const { resolvePeriod, greetingForPeriod } = require('./periods');
const HeroIllustration = require('./HeroIllustration');

describe('Hero Shared UI', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    const style = document.getElementById('cds-shared-ui-hero-styles');
    if (style) style.remove();
  });

  test('resolvePeriod cobre faixas oficiais', () => {
    expect(resolvePeriod(new Date('2026-07-13T05:00:00'))).toBe('morning');
    expect(resolvePeriod(new Date('2026-07-13T11:59:00'))).toBe('morning');
    expect(resolvePeriod(new Date('2026-07-13T12:00:00'))).toBe('afternoon');
    expect(resolvePeriod(new Date('2026-07-13T16:59:00'))).toBe('afternoon');
    expect(resolvePeriod(new Date('2026-07-13T17:00:00'))).toBe('sunset');
    expect(resolvePeriod(new Date('2026-07-13T18:59:00'))).toBe('sunset');
    expect(resolvePeriod(new Date('2026-07-13T19:00:00'))).toBe('night');
    expect(resolvePeriod(new Date('2026-07-13T04:59:00'))).toBe('night');
  });

  test('saudação muda por período', () => {
    expect(greetingForPeriod('morning')).toEqual({ emoji: '☀️', salutation: 'Bom dia' });
    expect(greetingForPeriod('afternoon')).toEqual({ emoji: '☀️', salutation: 'Boa tarde' });
    expect(greetingForPeriod('sunset')).toEqual({ emoji: '🌇', salutation: 'Boa tarde' });
    expect(greetingForPeriod('night')).toEqual({ emoji: '🌙', salutation: 'Boa noite' });
  });

  test('Hero usa wallpaper CSS — sem nó de ilustração no layout', () => {
    const hero = Hero.create({
      operatorName: 'Diego',
      now: new Date('2026-07-13T21:16:00'),
      liveClock: false,
      statusItems: [{ tone: 'urgent', text: '1 atendimento aguardando fechamento.' }],
      message: 'Tudo pronto para começar.',
      actions: [
        { label: 'Nova Entrega', variant: 'primary' },
        { label: 'Clientes', variant: 'secondary' }
      ]
    });
    document.body.appendChild(hero);

    expect(hero.dataset.sharedUi).toBe('Hero');
    expect(hero.dataset.period).toBe('night');
    expect(hero.className).toContain('cds-hero--night');
    expect(hero.querySelector('.cds-hero__title').textContent).toContain('Boa noite, Diego.');
    expect(hero.querySelector('.cds-hero__datetime').textContent).toMatch(/Hoje é/);
    expect(hero.querySelectorAll('.cds-hero__action')).toHaveLength(2);
    expect(hero.querySelector('.cds-hero__status-message').textContent).toBe('Tudo pronto para começar.');

    // Wallpaper via CSS variable — sem elemento visual separado
    expect(hero.querySelector('.cds-hero__illustration')).toBeNull();
    expect(hero.querySelector('.cds-hero__wallpaper')).toBeNull();
    expect(hero.querySelector('.cds-hero__layout')).toBeNull();
    expect(hero.style.getPropertyValue('--cds-hero-wallpaper')).toContain('data:image/svg+xml');
    expect(hero.dataset.wallpaperPeriod).toBe('night');

    const css = document.getElementById('cds-shared-ui-hero-styles').textContent;
    expect(css).toContain('.cds-hero::after');
    expect(css).toContain('--cds-hero-wallpaper');
  });

  test('update troca período e wallpaper', () => {
    const hero = Hero.create({
      operatorName: 'Diego',
      now: new Date('2026-07-13T09:00:00'),
      liveClock: false
    });
    expect(hero.cdsHero.getPeriod()).toBe('morning');
    expect(hero.dataset.wallpaperPeriod).toBe('morning');

    hero.cdsHero.update({ now: new Date('2026-07-13T18:30:00') });
    expect(hero.cdsHero.getPeriod()).toBe('sunset');
    expect(hero.className).toContain('cds-hero--sunset');
    expect(hero.dataset.wallpaperPeriod).toBe('sunset');
  });

  test('SVG wallpaper e asset preview por período', () => {
    ['morning', 'afternoon', 'sunset', 'night'].forEach((period) => {
      expect(HeroIllustration.toDataUri(period)).toContain('data:image/svg+xml');
      expect(HeroIllustration.getSvg(period)).toContain('<svg');
      const preview = HeroIllustration.create({ period });
      expect(preview.dataset.period).toBe(period);
      expect(preview.innerHTML).toContain('<svg');
    });
  });

  test('STATUS ready', () => {
    expect(Hero.STATUS).toBe('ready');
  });
});
