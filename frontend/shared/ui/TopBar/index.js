const { createPlannedComponent } = require('../_status');
module.exports = createPlannedComponent('TopBar', {
  responsibility: 'Barra global de sessão (empresa, usuário, motor)',
  events: ['onSwitchMotor', 'onLogout']
});
