/**
 * Keyboard — mapa oficial DS-001 + helpers
 * STATUS: planned (mapa publicado; overlay a implementar)
 */

const SHORTCUTS = Object.freeze({
  Enter: 'Confirma campo / avança / primário seguro',
  Escape: 'Cancela / fecha overlay / limpa busca',
  F2: 'Editar célula / item focado',
  F3: 'Localizar próximo',
  F4: 'Focar SmartSearch',
  F7: 'Ajuda / ShortcutHint',
  F8: 'Próximo passo Wizard',
  F9: 'Secundária 1 do ActionBar',
  F10: 'Menu Mais / ContextMenu',
  F12: 'Imprimir / preview',
  'Ctrl+S': 'Salvar / flush',
  'Ctrl+F': 'Focar SmartSearch',
  'Ctrl+P': 'Imprimir',
  'Ctrl+Enter': 'Confirmar e avançar',
  'Ctrl+K': 'CommandPalette'
});

module.exports = {
  STATUS: 'planned',
  NAME: 'Keyboard',
  SHORTCUTS,
  create() {
    throw new Error(
      '[SharedUI] Keyboard overlay ainda planned. Use SHORTCUTS e implemente em shared/ui/Keyboard. '
      + 'Ver .cds/DS-001.md §6 e UX_FOUNDATION_001.md'
    );
  }
};
