const Tabs = require('../../design-system/primitives/navigation/Tabs');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Tabs', Tabs.create.bind(Tabs), {
  responsibility: 'Alternar vistas no mesmo contexto',
  bridgeFrom: 'design-system/primitives/navigation/Tabs'
});
