const { createPlannedComponent } = require('../_status');
module.exports = createPlannedComponent('OperationalGrid', {
  responsibility: 'Grade editável operacional — scroll interno, teclado, dirty/flush',
  events: ['onCellChange', 'onCommit', 'onFlush', 'onRetryRow'],
  notes: 'Migrar grade Prestação (STAB-04) para cá'
});
