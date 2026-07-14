const WizardLayout = require('../../design-system/primitives/layouts/WizardLayout');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Wizard', WizardLayout.create.bind(WizardLayout), {
  responsibility: 'Fluxo multipasso com header/body/footer',
  bridgeFrom: 'design-system/primitives/layouts/WizardLayout',
  events: ['onNext', 'onBack', 'onFinish', 'onCancel'],
  getStyles: WizardLayout.getStyles ? WizardLayout.getStyles.bind(WizardLayout) : undefined
});
