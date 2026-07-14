const { createPlannedComponent } = require('../_status');
module.exports = createPlannedComponent('NavigationRail', {
  responsibility: '≤ 5 destinos primários do operador',
  events: ['onNavigate']
});
