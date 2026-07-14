const Drawer = require('../../design-system/primitives/special/Drawer');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Drawer', Drawer.create.bind(Drawer), {
  responsibility: 'Detalhe/consulta sem sair da listagem',
  bridgeFrom: 'design-system/primitives/special/Drawer',
  events: ['onOpen', 'onClose', 'onTabChange']
});
