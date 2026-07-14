/**
 * Shared UI — Barrel oficial (UX-FOUNDATION-001 / DS-001)
 *
 * Motores devem importar exclusivamente deste módulo para UI operacional.
 *
 * @module frontend/shared/ui
 */

module.exports = {
  AppShell: require('./AppShell'),
  Workspace: require('./Workspace'),
  WorkspaceHeader: require('./WorkspaceHeader'),
  WorkspaceFooter: require('./WorkspaceFooter'),
  NavigationRail: require('./NavigationRail'),
  TopBar: require('./TopBar'),
  SmartSearch: require('./SmartSearch'),
  OperationalGrid: require('./OperationalGrid'),
  EntityCard: require('./EntityCard'),
  Hero: require('./Hero'),
  BankStatement: require('./BankStatement'),
  CreditStrip: require('./CreditStrip'),
  Wizard: require('./Wizard'),
  Stepper: require('./Stepper'),
  ActionBar: require('./ActionBar'),
  Toolbar: require('./Toolbar'),
  FiltersBar: require('./FiltersBar'),
  StatusBadge: require('./StatusBadge'),
  StateIndicator: require('./StateIndicator'),
  SummaryCard: require('./SummaryCard'),
  DataTable: require('./DataTable'),
  Timeline: require('./Timeline'),
  Drawer: require('./Drawer'),
  Modal: require('./Modal'),
  ConfirmDialog: require('./ConfirmDialog'),
  Toast: require('./Toast'),
  Loading: require('./Loading'),
  Empty: require('./Empty'),
  Error: require('./Error'),
  Pagination: require('./Pagination'),
  Tabs: require('./Tabs'),
  CommandPalette: require('./CommandPalette'),
  QuickActions: require('./QuickActions'),
  Keyboard: require('./Keyboard'),
  Hooks: require('./Hooks'),
  Tokens: require('./Tokens'),
  Utils: require('./Utils')
};
