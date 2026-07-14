const { createPlannedComponent } = require('../_status');
module.exports = createPlannedComponent('AppShell', {
  responsibility: 'Casca da aplicação: navegação + slot de conteúdo',
  events: ['onNavigate', 'onLogout']
});
