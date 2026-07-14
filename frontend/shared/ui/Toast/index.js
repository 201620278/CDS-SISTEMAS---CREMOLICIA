const { createPlannedComponent } = require('../_status');
module.exports = createPlannedComponent('Toast', {
  responsibility: 'Feedback breve não bloqueante',
  events: ['onDismiss']
});
