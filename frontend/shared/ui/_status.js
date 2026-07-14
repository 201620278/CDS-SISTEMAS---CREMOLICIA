/**
 * Shared UI — helper de status de implementação
 * @module frontend/shared/ui/_status
 */

function createPlannedComponent(name, meta = {}) {
  const api = {
    STATUS: 'planned',
    NAME: name,
    DS: meta.ds || name,
    ...meta,
    create() {
      throw new Error(
        `[SharedUI] ${name} ainda não implementado (STATUS=planned). `
        + 'Evolua frontend/shared/ui/' + name + ' — não crie fork no motor. '
        + 'Ver .cds/UX_FOUNDATION_001.md'
      );
    }
  };
  return api;
}

function createBridgeComponent(name, factory, meta = {}) {
  return {
    STATUS: 'bridge',
    NAME: name,
    DS: meta.ds || name,
    ...meta,
    create: factory,
    getStyles: typeof factory.getStyles === 'function' ? factory.getStyles.bind(factory) : undefined
  };
}

module.exports = {
  createPlannedComponent,
  createBridgeComponent
};
