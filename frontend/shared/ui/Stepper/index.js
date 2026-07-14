const Stepper = require('../../design-system/primitives/navigation/Stepper');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Stepper', Stepper.create.bind(Stepper), {
  responsibility: 'Indicador de progresso do Wizard',
  bridgeFrom: 'design-system/primitives/navigation/Stepper'
});
