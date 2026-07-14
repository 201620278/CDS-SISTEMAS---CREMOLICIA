const Badge = require('../../design-system/primitives/base/Badge');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('StatusBadge', Badge.create.bind(Badge), {
  responsibility: 'Selo de status de entidade/documento',
  bridgeFrom: 'design-system/primitives/base/Badge',
  createStatus: Badge.createStatus ? Badge.createStatus.bind(Badge) : undefined
});

module.exports.createStatus = Badge.createStatus
  ? Badge.createStatus.bind(Badge)
  : undefined;
