const Table = require('../../design-system/primitives/data/Table');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('DataTable', Table.create.bind(Table), {
  responsibility: 'Tabela de consulta (não digitação intensa)',
  bridgeFrom: 'design-system/primitives/data/Table',
  events: ['onRowAction', 'onSort', 'onPageChange']
});
