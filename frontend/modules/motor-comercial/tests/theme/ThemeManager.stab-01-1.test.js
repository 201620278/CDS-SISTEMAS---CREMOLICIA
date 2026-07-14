/**
 * STAB-01.1 — ThemeManager: Classic como padrão do ERP
 */

const {
  THEMES,
  STORAGE_KEY,
  MIGRATION_KEY,
  setTheme,
  getTheme,
  initTheme,
  isValidTheme
} = require('../../../../shared/design-system/themes/ThemeManager');

describe('ThemeManager STAB-01.1', () => {
  let root;

  beforeEach(() => {
    localStorage.clear();
    root = document.documentElement;
    root.removeAttribute('data-theme');
    root.className = '';
  });

  test('default theme constant is classic', () => {
    expect(THEMES.CLASSIC).toBe('classic');
    expect(isValidTheme('classic')).toBe(true);
    expect(isValidTheme('dark')).toBe(true);
    expect(isValidTheme('high-contrast')).toBe(true);
    expect(isValidTheme('auto')).toBe(false);
  });

  test('initTheme without storage applies classic', () => {
    const theme = initTheme({ skipMigration: true });
    expect(theme).toBe('classic');
    expect(getTheme()).toBe('classic');
    expect(root.getAttribute('data-theme')).toBe('classic');
    expect(root.classList.contains('theme-classic')).toBe(true);
    expect(root.classList.contains('theme-dark')).toBe(false);
  });

  test('initTheme never falls back to dark when storage empty', () => {
    const theme = initTheme({ defaultTheme: 'classic', skipMigration: true });
    expect(theme).toBe('classic');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('classic');
  });

  test('migration clears legacy dark inherited from login key', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    expect(localStorage.getItem(MIGRATION_KEY)).toBeNull();

    const theme = initTheme();
    expect(theme).toBe('classic');
    expect(root.getAttribute('data-theme')).toBe('classic');
    expect(localStorage.getItem(MIGRATION_KEY)).toBe('1');
  });

  test('explicit setTheme(dark) persists and applies dark', () => {
    localStorage.setItem(MIGRATION_KEY, '1');
    const theme = setTheme('dark');
    expect(theme).toBe('dark');
    expect(root.getAttribute('data-theme')).toBe('dark');
    expect(root.classList.contains('theme-dark')).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');

    root.removeAttribute('data-theme');
    root.className = '';
    const again = initTheme({ skipMigration: true });
    expect(again).toBe('dark');
  });

  test('high-contrast remains selectable explicitly', () => {
    localStorage.setItem(MIGRATION_KEY, '1');
    expect(setTheme('high-contrast')).toBe('high-contrast');
    expect(root.classList.contains('theme-high-contrast')).toBe(true);
  });

  test('invalid theme falls back to classic', () => {
    expect(setTheme('nocturnal')).toBe('classic');
    expect(root.getAttribute('data-theme')).toBe('classic');
  });
});
