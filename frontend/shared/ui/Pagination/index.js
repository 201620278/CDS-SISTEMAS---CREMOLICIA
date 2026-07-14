const Pagination = require('../../design-system/primitives/data/Pagination');
const { createBridgeComponent } = require('../_status');

module.exports = createBridgeComponent('Pagination', Pagination.create.bind(Pagination), {
  responsibility: 'Paginação de DataTable/arquivo',
  bridgeFrom: 'design-system/primitives/data/Pagination',
  events: ['onPageChange', 'onPageSizeChange']
});
