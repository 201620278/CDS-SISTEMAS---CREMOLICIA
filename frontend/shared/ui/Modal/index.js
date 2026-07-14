const Modal = require('../../design-system/primitives/navigation/Modal');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Modal', Modal.create.bind(Modal), {
  responsibility: 'Foco absoluto em uma decisão',
  bridgeFrom: 'design-system/primitives/navigation/Modal',
  events: ['onConfirm', 'onCancel', 'onClose']
});
