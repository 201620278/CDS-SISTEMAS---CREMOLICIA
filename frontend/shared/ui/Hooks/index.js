/**
 * Hooks compartilhados — Shared UI
 * STATUS: planned (API reservada)
 */

function notReady(name) {
  return function plannedHook() {
    throw new Error(`[SharedUI] Hook ${name} planned — implemente em shared/ui/Hooks`);
  };
}

module.exports = {
  STATUS: 'planned',
  NAME: 'Hooks',
  useDebouncedQuery: notReady('useDebouncedQuery'),
  useFocusRestore: notReady('useFocusRestore'),
  useHotkeys: notReady('useHotkeys'),
  useSmartSearch: notReady('useSmartSearch')
};
