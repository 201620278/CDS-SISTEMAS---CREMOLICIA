const CDSStatusIndicator = require('../../design-system/components/data/CDSStatusIndicator');
const { createBridgeComponent, createPlannedComponent } = require('../_status');

if (CDSStatusIndicator && typeof CDSStatusIndicator.create === 'function') {
  module.exports = createBridgeComponent(
    'StateIndicator',
    CDSStatusIndicator.create.bind(CDSStatusIndicator),
    {
      responsibility: 'Estado da operação em curso (dirty/saved/blocked)',
      bridgeFrom: 'design-system/components/data/CDSStatusIndicator'
    }
  );
} else {
  module.exports = createPlannedComponent('StateIndicator', {
    responsibility: 'Estado da operação em curso (dirty/saved/blocked)'
  });
}
