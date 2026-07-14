const ErrorState = require('../../design-system/primitives/base/ErrorState');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Error', ErrorState.create.bind(ErrorState), {
  responsibility: 'Falha recuperável da área com retry',
  bridgeFrom: 'design-system/primitives/base/ErrorState',
  events: ['onRetry']
});
