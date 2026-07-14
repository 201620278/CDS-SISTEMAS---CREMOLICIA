const { createPlannedComponent } = require('../_status');
module.exports = createPlannedComponent('ConfirmDialog', {
  responsibility: 'Modal de confirmação padronizado (uma pergunta)',
  events: ['onConfirm', 'onCancel'],
  dependsOn: ['Modal']
});
