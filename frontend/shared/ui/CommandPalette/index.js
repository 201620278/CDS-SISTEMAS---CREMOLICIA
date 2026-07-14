const { createPlannedComponent } = require('../_status');
module.exports = createPlannedComponent('CommandPalette', {
  responsibility: 'Paleta de comandos (Ctrl+K)',
  events: ['onCommand']
});
