const Timeline = require('../../design-system/primitives/special/Timeline');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Timeline', Timeline.create.bind(Timeline), {
  responsibility: 'Histórico cronológico de eventos',
  bridgeFrom: 'design-system/primitives/special/Timeline'
});
