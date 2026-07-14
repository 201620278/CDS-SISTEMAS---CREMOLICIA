const { createPlannedComponent } = require('../_status');
module.exports = createPlannedComponent('QuickActions', {
  responsibility: 'Atalhos gerais da Central (não repetem fila prioritária)',
  events: ['onAction']
});
