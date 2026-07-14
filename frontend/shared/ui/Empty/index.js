const EmptyState = require('../../design-system/primitives/base/EmptyState');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Empty', EmptyState.create.bind(EmptyState), {
  responsibility: 'Área sem dados com CTA opcional',
  bridgeFrom: 'design-system/primitives/base/EmptyState'
});
